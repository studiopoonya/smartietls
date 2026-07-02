<?php

namespace App\Http\Controllers;

use App\Models\Vocabulary;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class VocabularyController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $perPage = min((int) ($request->per_page ?? 20), 200);

        $vocab = $request->user()->vocabularies()
            ->when($request->due, fn($q) => $q->where('next_review_at', '<=', now()))
            ->latest()
            ->paginate($perPage);

        return response()->json($vocab);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'word' => 'required|string|max:100',
            'definition_data' => 'required|array',
        ]);

        $exists = $request->user()->vocabularies()->where('word', $validated['word'])->first();
        if ($exists) {
            return response()->json(['message' => 'Word already saved', 'vocabulary' => $exists], 200);
        }

        $vocab = $request->user()->vocabularies()->create(array_merge($validated, [
            'next_review_at' => now()->addDay(),
        ]));

        return response()->json($vocab, 201);
    }

    public function show(Request $request, Vocabulary $vocabulary): JsonResponse
    {
        if ($vocabulary->user_id !== $request->user()->id) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }
        return response()->json($vocabulary);
    }

    public function update(Request $request, Vocabulary $vocabulary): JsonResponse
    {
        if ($vocabulary->user_id !== $request->user()->id) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $vocabulary->increment('review_count');
        $vocabulary->update(['next_review_at' => now()->addDays($vocabulary->review_count * 2)]);

        return response()->json($vocabulary);
    }

    public function destroy(Request $request, Vocabulary $vocabulary): JsonResponse
    {
        if ($vocabulary->user_id !== $request->user()->id) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $vocabulary->delete();
        return response()->json(['message' => 'Word removed']);
    }
}
