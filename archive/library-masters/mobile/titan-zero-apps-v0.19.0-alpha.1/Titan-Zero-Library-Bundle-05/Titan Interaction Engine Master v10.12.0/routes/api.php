<?php

declare(strict_types=1);

use Illuminate\Support\Facades\Route;
use App\Extensions\InteractionEngine\System\Http\Controllers\InteractionController;
use App\Extensions\InteractionEngine\System\Http\Controllers\LocalIntelligenceController;
use App\Extensions\InteractionEngine\System\Http\Controllers\OfflineCommandController;
use App\Extensions\InteractionEngine\System\Http\Controllers\WizardController;
use App\Extensions\InteractionEngine\System\Http\Controllers\TemplateController;
use App\Extensions\InteractionEngine\System\Http\Controllers\CognitiveEventController;
use App\Extensions\InteractionEngine\System\Http\Controllers\FieldServicesOnboardingController;
use App\Extensions\InteractionEngine\System\Http\Controllers\SyncController;
use App\Extensions\InteractionEngine\System\Http\Controllers\JourneyController;
use App\Extensions\InteractionEngine\System\Http\Controllers\SettingsApiController;

// Declare fixed paths before the generic interaction identifier route.
Route::get('/settings', [SettingsApiController::class, 'show'])->name('settings.show');
Route::post('/settings/company', [SettingsApiController::class, 'updateCompany'])->name('settings.company.update');
Route::post('/settings/preferences', [SettingsApiController::class, 'updatePreferences'])->name('settings.preferences.update');
Route::get('/journeys', [JourneyController::class, 'index'])->name('journeys.index');
Route::post('/journeys/{journey}/start', [JourneyController::class, 'start'])->name('journeys.start');
Route::get('/interactions/{session}', [JourneyController::class, 'show'])->name('interactions.show');
Route::post('/interactions/{session}/answer', [JourneyController::class, 'answer'])->name('interactions.answer');
Route::get('/interactions/{session}/next', [JourneyController::class, 'next'])->name('interactions.next');
Route::post('/interactions/{session}/preview', [JourneyController::class, 'preview'])->name('interactions.preview');
Route::post('/interactions/{session}/approve', [JourneyController::class, 'approve'])->name('interactions.approve');
Route::post('/interactions/{session}/execute', [JourneyController::class, 'execute'])->name('interactions.execute');
Route::get('/interactions/{session}/readiness', [JourneyController::class, 'readiness'])->name('interactions.readiness');
Route::get('/onboarding/field-services/catalogue', [FieldServicesOnboardingController::class, 'catalogue'])->name('onboarding.field-services.catalogue');
Route::post('/onboarding/field-services/compile', [FieldServicesOnboardingController::class, 'compile'])->name('onboarding.field-services.compile');
Route::get('/onboarding/field-services/plans/{planId}', [FieldServicesOnboardingController::class, 'show'])->name('onboarding.field-services.plans.show');
Route::post('/onboarding/field-services/plans/{planId}/approve', [FieldServicesOnboardingController::class, 'approve'])->name('onboarding.field-services.plans.approve');
Route::post('/onboarding/field-services/execute', [FieldServicesOnboardingController::class, 'execute'])->name('onboarding.field-services.execute');
Route::get('/onboarding/field-services/plans/{planId}/readiness', [FieldServicesOnboardingController::class, 'readiness'])->name('onboarding.field-services.readiness');
Route::get('/templates', [TemplateController::class, 'index'])->name('templates.index');
Route::get('/templates/{templateId}', [TemplateController::class, 'show'])->name('templates.show');
Route::get('/wizards', [WizardController::class, 'index'])->name('wizards.index');
Route::post('/wizards/{wizardId}/start', [WizardController::class, 'start'])->name('wizards.start');
Route::get('/wizard-sessions/{sessionId}', [WizardController::class, 'show'])->name('wizards.show');
Route::post('/wizard-sessions/{sessionId}/steps', [WizardController::class, 'submitStep'])->name('wizards.steps.submit');
Route::post('/local-intelligence/process', [LocalIntelligenceController::class, 'process'])->name('local-intelligence.process');
Route::post('/offline-commands', [OfflineCommandController::class, 'store'])->name('offline-commands.store');
Route::get('/sync', [SyncController::class, 'status'])->name('sync.status');
Route::post('/sync', [SyncController::class, 'sync'])->name('sync.run');
Route::get('/cognitive-events/{correlationId}', [CognitiveEventController::class, 'timeline'])->whereUuid('correlationId')->name('cognitive-events.timeline');
Route::post('/cognitive-events/corrections', [CognitiveEventController::class, 'correction'])->name('cognitive-events.corrections');
Route::post('/cognitive-events/outcomes', [CognitiveEventController::class, 'outcome'])->name('cognitive-events.outcomes');
Route::post('/runs/{runId}/process', [InteractionController::class, 'process'])->whereNumber('runId')->name('process');
Route::get('/{interactionId}', [InteractionController::class, 'show'])
    ->where('interactionId', '^(?!templates$|wizards$|wizard-sessions$|local-intelligence$|offline-commands$|cognitive-events$|onboarding$).+')
    ->name('show');
