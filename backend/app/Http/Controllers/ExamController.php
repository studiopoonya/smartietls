<?php

namespace App\Http\Controllers;

use App\Models\ExamSimulation;
use App\Models\User;
use App\Services\CurriculumProgress;
use App\Services\ExamEngine;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class ExamController extends Controller
{
    public function __construct(
        private ExamEngine $engine,
        private CurriculumProgress $progress,
    ) {}

    public function status(Request $request): JsonResponse
    {
        $user = $request->user();
        $active = $this->activeExam($user);
        $latest = ExamSimulation::where('user_id', $user->id)->where('status', 'completed')->latest('id')->first();

        return response()->json([
            'gates'  => $this->progress->snapshot($user)['gates'],
            'active' => $active ? $this->engine->publicState($active) : null,
            'latest' => $latest ? $this->engine->publicState($latest) : null,
        ]);
    }

    public function start(Request $request): JsonResponse
    {
        $user = $request->user();

        if ($active = $this->activeExam($user)) {
            return response()->json($this->engine->publicState($active));
        }

        if (!$this->progress->snapshot($user)['gates']['examUnlocked']) {
            return response()->json(['message' => 'Complete at least 70% of the component modules and any pending rewrite first.'], 423);
        }

        // Two tabs or a network retry can call start at the same moment. Locking the user row makes the
        // second request wait and then find the exam the first one created.
        [$exam, $created] = DB::transaction(function () use ($user) {
            User::whereKey($user->id)->lockForUpdate()->first();
            $existing = ExamSimulation::where('user_id', $user->id)->whereIn('status', ExamEngine::ACTIVE_STATUSES)->latest('id')->first();
            return $existing ? [$existing, false] : [ExamSimulation::create(['user_id' => $user->id, 'status' => 'preparing']), true];
        });

        return response()->json($this->engine->publicState($exam), $created ? 201 : 200);
    }

    public function prepare(Request $request, ExamSimulation $exam): JsonResponse
    {
        $this->authorizeOwner($request, $exam);

        if ($exam->status !== 'preparing') {
            return response()->json($this->engine->publicState($exam));
        }

        return $this->withClaude($request, function ($apiKey) use ($exam) {
            $this->engine->prepareNext($exam, $apiKey);
            return $this->engine->publicState($exam);
        });
    }

    public function save(Request $request, ExamSimulation $exam): JsonResponse
    {
        $this->authorizeOwner($request, $exam);

        $data = $request->validate([
            'stage'     => 'required|in:listening,reading,writing',
            'responses' => 'present|array',
        ]);

        return response()->json(['saved' => $this->engine->saveProgress($exam, $data['stage'], $data['responses'])]);
    }

    public function submitStage(Request $request, ExamSimulation $exam): JsonResponse
    {
        $this->authorizeOwner($request, $exam);

        $data = $request->validate([
            'stage'     => 'required|in:listening,reading,writing',
            'responses' => 'present|array',
        ]);

        $this->engine->submitStage($exam, $data['stage'], $data['responses']);

        return response()->json($this->engine->publicState($exam));
    }

    public function finalize(Request $request, ExamSimulation $exam): JsonResponse
    {
        $this->authorizeOwner($request, $exam);

        if (!in_array($exam->status, ['evaluating', 'finalizing'], true)) {
            return response()->json($this->engine->publicState($exam));
        }

        return $this->withClaude($request, function ($apiKey) use ($request, $exam) {
            $this->engine->finalize($request->user(), $exam, $apiKey);
            return $this->engine->publicState($exam);
        });
    }

    public function abandon(Request $request, ExamSimulation $exam): JsonResponse
    {
        $this->authorizeOwner($request, $exam);

        $this->engine->abandon($exam);

        return response()->json($this->engine->publicState($exam));
    }

    private function activeExam(User $user): ?ExamSimulation
    {
        $exam = ExamSimulation::where('user_id', $user->id)->whereIn('status', ExamEngine::ACTIVE_STATUSES)->latest('id')->first();

        if ($exam) $this->engine->syncDeadline($exam);

        return $exam;
    }

    private function authorizeOwner(Request $request, ExamSimulation $exam): void
    {
        abort_unless($exam->user_id === $request->user()->id, 403);
    }

    private function withClaude(Request $request, callable $action): JsonResponse
    {
        $apiKey = $request->user()->effectiveApiKey();
        if (!$apiKey) {
            return response()->json(['message' => 'API key not configured. Please contact admin.'], 422);
        }

        try {
            return response()->json($action($apiKey));
        } catch (\Exception $e) {
            Log::error('Exam error: ' . $e->getMessage());
            return response()->json(['message' => $e->getMessage()], 500);
        }
    }
}
