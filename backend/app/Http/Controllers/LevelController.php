<?php

namespace App\Http\Controllers;

use App\Services\LevelService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class LevelController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        return response()->json(LevelService::allLevels($request->user()));
    }
}
