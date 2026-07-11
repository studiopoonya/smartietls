<?php

use App\Http\Controllers\AI\AIListeningController;
use App\Http\Controllers\LessonController;
use App\Http\Controllers\AI\AIMockTestController;
use App\Http\Controllers\AI\AIReadingController;
use App\Http\Controllers\AI\AISpeakingController;
use App\Http\Controllers\AI\AIVocabularyController;
use App\Http\Controllers\AI\AIWritingController;
use App\Http\Controllers\AdminController;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\LevelController;
use App\Http\Controllers\ProgressController;
use App\Http\Controllers\SessionController;
use App\Http\Controllers\UserController;
use App\Http\Controllers\VocabularyController;
use Illuminate\Support\Facades\Route;

// Auth (public)
Route::post('/register', [AuthController::class, 'register']);
Route::post('/login', [AuthController::class, 'login']);

// Protected routes
Route::middleware('auth:sanctum')->group(function () {

    // Auth
    Route::post('/logout', [AuthController::class, 'logout']);

    // User
    Route::get('/user', [UserController::class, 'me']);
    Route::put('/user/profile', [UserController::class, 'updateProfile']);
    Route::post('/user/api-key', [UserController::class, 'saveApiKey']);
    Route::post('/user/api-key/test', [UserController::class, 'testApiKey']);

    // Dashboard
    Route::get('/dashboard', [DashboardController::class, 'index']);

    // Lesson progress
    Route::get('/lessons/progress', [LessonController::class, 'progress']);
    Route::post('/lessons/{lessonId}/complete', [LessonController::class, 'complete']);

    // Levels (per-module difficulty unlock progression)
    Route::get('/levels', [LevelController::class, 'index']);

    // AI Proxy endpoints
    Route::prefix('ai')->group(function () {
        Route::post('/writing/analyze', [AIWritingController::class, 'analyze']);
        Route::post('/speaking/message', [AISpeakingController::class, 'chat']);
        Route::post('/speaking/generate', [AISpeakingController::class, 'generate']);
        Route::post('/speaking/evaluate', [AISpeakingController::class, 'evaluate']);
        Route::post('/reading/generate', [AIReadingController::class, 'generate']);
        Route::post('/listening/generate', [AIListeningController::class, 'generate']);
        Route::post('/vocabulary/explain', [AIVocabularyController::class, 'explain']);
        Route::post('/mock-test/evaluate', [AIMockTestController::class, 'evaluate']);
    });

    // Data endpoints
    Route::apiResource('sessions', SessionController::class)->only(['index', 'store', 'show']);
    Route::apiResource('vocabulary', VocabularyController::class);
    Route::get('/progress', [ProgressController::class, 'index']);
    Route::get('/progress/chart', [ProgressController::class, 'chartData']);

    // Admin routes
    Route::prefix('admin')->middleware('admin')->group(function () {
        Route::get('/overview', [AdminController::class, 'overview']);
        Route::get('/users', [AdminController::class, 'users']);
        Route::get('/users/{user}', [AdminController::class, 'showUser']);
        Route::get('/users/{user}/progress', [AdminController::class, 'userProgress']);
        Route::get('/users/{user}/sessions', [AdminController::class, 'userSessions']);
        Route::put('/users/{user}', [AdminController::class, 'updateUser']);
        Route::patch('/users/{user}/toggle-admin', [AdminController::class, 'toggleAdmin']);
        Route::delete('/users/{user}', [AdminController::class, 'deleteUser']);
    });
});
