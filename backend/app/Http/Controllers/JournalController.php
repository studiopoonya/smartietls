<?php

namespace App\Http\Controllers;

use App\Services\JournalLibrary;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class JournalController extends Controller
{
    public function __construct(private JournalLibrary $library) {}

    public function search(Request $request): JsonResponse
    {
        $data = $request->validate([
            'q'      => 'required|string|min:2|max:120',
            'cursor' => 'nullable|string|max:200',
        ]);

        // The query goes into a Europe PMC search, so its field syntax is removed.
        $query = trim(preg_replace('/[^\p{L}\p{N}\s\'-]/u', ' ', $data['q']));
        if (mb_strlen($query) < 2) {
            return response()->json(['message' => 'Please type a topic to search for.'], 422);
        }

        try {
            return response()->json($this->library->search($query, $data['cursor'] ?? '*'));
        } catch (\Exception $e) {
            Log::warning('Journal search failed: ' . $e->getMessage());
            return response()->json(['message' => 'The journal library is not responding. Please try again in a moment.'], 502);
        }
    }

    public function show(string $id): JsonResponse
    {
        abort_unless(preg_match('/^PMC\d{1,10}$/', $id), 404);

        try {
            $article = $this->library->article($id);
        } catch (\Exception $e) {
            Log::warning('Journal article failed: ' . $e->getMessage());
            return response()->json(['message' => 'The journal library is not responding. Please try again in a moment.'], 502);
        }

        return $article
            ? response()->json($article)
            : response()->json(['message' => 'This article is not available under an open licence.'], 404);
    }
}
