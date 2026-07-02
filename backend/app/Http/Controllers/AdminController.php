<?php

namespace App\Http\Controllers;

use App\Models\LearningSession;
use App\Models\User;
use App\Models\Vocabulary;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AdminController extends Controller
{
    public function overview(): JsonResponse
    {
        $totalUsers     = User::count();
        $activeUsers7d  = User::where('last_active_date', '>=', now()->subDays(7)->toDateString())->count();
        $newUsers7d     = User::where('created_at', '>=', now()->subDays(7))->count();
        $totalSessions  = LearningSession::count();
        $sessions7d     = LearningSession::where('created_at', '>=', now()->subDays(7))->count();
        $totalVocab     = Vocabulary::count();
        $avgBand        = round(LearningSession::whereNotNull('band_score')->avg('band_score') ?? 0, 1);

        $sessionsByModule = LearningSession::selectRaw('module, count(*) as count')
            ->groupBy('module')
            ->pluck('count', 'module');

        $dailySessions = LearningSession::selectRaw('DATE(created_at) as date, count(*) as count')
            ->where('created_at', '>=', now()->subDays(30))
            ->groupBy('date')
            ->orderBy('date')
            ->get();

        $recentUsers = User::withCount(['learningSessions', 'vocabularies'])
            ->latest()
            ->limit(5)
            ->get(['id', 'name', 'email', 'target_band', 'streak_days', 'is_admin', 'created_at']);

        return response()->json([
            'stats' => [
                'total_users'     => $totalUsers,
                'active_users_7d' => $activeUsers7d,
                'new_users_7d'    => $newUsers7d,
                'total_sessions'  => $totalSessions,
                'sessions_7d'     => $sessions7d,
                'total_vocab'     => $totalVocab,
                'avg_band'        => $avgBand,
            ],
            'sessions_by_module' => $sessionsByModule,
            'daily_sessions'     => $dailySessions,
            'recent_users'       => $recentUsers,
        ]);
    }

    public function users(Request $request): JsonResponse
    {
        $search  = $request->search;
        $allowed = ['created_at', 'name', 'streak_days', 'last_active_date'];
        $sort    = in_array($request->sort, $allowed) ? $request->sort : 'created_at';
        $dir     = $request->dir === 'asc' ? 'asc' : 'desc';

        $users = User::withCount(['learningSessions', 'vocabularies'])
            ->when($search, fn($q) => $q->where(fn($q2) =>
                $q2->where('name', 'like', "%$search%")
                   ->orWhere('email', 'like', "%$search%")
            ))
            ->orderBy($sort, $dir)
            ->paginate(20);

        return response()->json($users);
    }

    public function showUser(User $user): JsonResponse
    {
        $recentSessions = $user->learningSessions()
            ->latest()
            ->limit(10)
            ->get(['id', 'module', 'band_score', 'duration_seconds', 'created_at']);

        $latestSnapshot = $user->progressSnapshots()->latest()->first();

        return response()->json([
            'user' => array_merge($user->toArray(), [
                'session_count' => $user->learningSessions()->count(),
                'vocab_count'   => $user->vocabularies()->count(),
                'exam_date'     => $user->exam_date?->toDateString(),
            ]),
            'recent_sessions' => $recentSessions,
            'latest_snapshot' => $latestSnapshot,
        ]);
    }

    public function userProgress(User $user, Request $request): JsonResponse
    {
        $days = $request->integer('days', 30);

        $latestSnapshot = $user->progressSnapshots()->latest()->first();

        $moduleStats = [];
        foreach (['writing', 'speaking', 'reading', 'listening'] as $module) {
            $sessions = $user->learningSessions()
                ->where('module', $module)
                ->whereNotNull('band_score')
                ->orderBy('created_at')
                ->get(['band_score', 'created_at']);

            $moduleStats[$module] = [
                'sessions'    => $sessions->count(),
                'latest_band' => $sessions->last()?->band_score,
                'avg_band'    => $sessions->count() ? round($sessions->avg('band_score'), 1) : null,
            ];
        }

        $chartData = $user->progressSnapshots()
            ->where('created_at', '>=', now()->subDays($days))
            ->orderBy('created_at')
            ->get()
            ->map(fn($s) => [
                'date'      => $s->created_at->format('M d'),
                'overall'   => (float) $s->overall_band,
                'writing'   => $s->writing_band ? (float) $s->writing_band : null,
                'speaking'  => $s->speaking_band ? (float) $s->speaking_band : null,
                'reading'   => $s->reading_band ? (float) $s->reading_band : null,
                'listening' => $s->listening_band ? (float) $s->listening_band : null,
            ]);

        return response()->json([
            'latest_snapshot' => $latestSnapshot,
            'module_stats'    => $moduleStats,
            'chart_data'      => $chartData,
            'total_sessions'  => $user->learningSessions()->count(),
            'streak_days'     => $user->streak_days,
        ]);
    }

    public function userSessions(User $user, Request $request): JsonResponse
    {
        $sessions = $user->learningSessions()
            ->when($request->module, fn($q) => $q->where('module', $request->module))
            ->latest()
            ->paginate(15);

        return response()->json($sessions);
    }

    public function updateUser(User $user, Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name'        => 'sometimes|string|max:255',
            'email'       => 'sometimes|string|email|max:255|unique:users,email,' . $user->id,
            'target_band' => 'sometimes|integer|min:4|max:9',
        ]);

        $user->update($validated);

        return response()->json(['message' => 'User updated successfully', 'user' => $user]);
    }

    public function toggleAdmin(User $user, Request $request): JsonResponse
    {
        if ($user->id === $request->user()->id) {
            return response()->json(['message' => 'Cannot modify your own admin status'], 422);
        }

        $user->update(['is_admin' => !$user->is_admin]);

        return response()->json([
            'is_admin' => $user->is_admin,
            'message'  => $user->is_admin ? 'Admin access granted' : 'Admin access revoked',
        ]);
    }

    public function deleteUser(User $user, Request $request): JsonResponse
    {
        if ($user->id === $request->user()->id) {
            return response()->json(['message' => 'Cannot delete your own account'], 422);
        }

        $user->delete();

        return response()->json(['message' => 'User deleted successfully']);
    }
}
