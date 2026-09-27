<?php

use Illuminate\Support\Facades\Route;
use Modules\CustomerFeedback\Http\Controllers\FeedbackTicketController;
use Modules\CustomerFeedback\Http\Controllers\FeedbackReplyController;
use Modules\CustomerFeedback\Http\Controllers\NpsSurveyController;

Route::prefix('api/feedback')->middleware('auth:api')->group(function () {
    // Tickets API
    Route::apiResource('tickets', FeedbackTicketController::class);
    Route::post('tickets/{ticket}/replies', [FeedbackReplyController::class, 'store']);
    Route::get('tickets/{ticket}/replies', [FeedbackReplyController::class, 'index']);

    // Surveys API
    Route::post('surveys/nps', [NpsSurveyController::class, 'store']);
    Route::get('surveys/nps/{survey}', [NpsSurveyController::class, 'show']);
    Route::post('surveys/nps/{survey}/respond', [NpsSurveyController::class, 'submitResponse']);
});

// Public anonymous survey submission is intentionally disabled until a signed respondent-token contract is available.
