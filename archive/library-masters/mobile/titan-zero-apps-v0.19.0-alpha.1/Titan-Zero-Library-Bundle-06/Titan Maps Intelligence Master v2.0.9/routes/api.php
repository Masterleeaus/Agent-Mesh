<?php

declare(strict_types=1);

use App\Extensions\TitanMapsIntelligence\Http\Controllers\CandidateController;
use App\Extensions\TitanMapsIntelligence\Http\Controllers\ExportController;
use App\Extensions\TitanMapsIntelligence\Http\Controllers\SearchController;
use App\Extensions\TitanMapsIntelligence\Http\Controllers\TerritoryController;
use App\Extensions\TitanMapsIntelligence\Http\Controllers\UsageController;
use App\Extensions\TitanMapsIntelligence\Http\Controllers\WorkerTrackingController;
use App\Extensions\TitanMapsIntelligence\Http\Controllers\ExportDownloadController;
use App\Extensions\TitanMapsIntelligence\Http\Controllers\GeofenceController;
use App\Extensions\TitanMapsIntelligence\Http\Controllers\RouteSnapshotController;
use App\Extensions\TitanMapsIntelligence\Http\Controllers\TravelMatrixController;
use App\Extensions\TitanMapsIntelligence\Http\Controllers\RoutePlanController;
use App\Extensions\TitanMapsIntelligence\Http\Controllers\DispatchIntelligenceController;
use App\Extensions\TitanMapsIntelligence\Http\Controllers\ServiceTerritoryController;
use App\Extensions\TitanMapsIntelligence\Http\Controllers\GeographicPricingController;
use App\Extensions\TitanMapsIntelligence\Http\Controllers\TerritoryAnalyticsController;
use App\Extensions\TitanMapsIntelligence\Http\Controllers\ResourceFallbackController;
use App\Extensions\TitanMapsIntelligence\Http\Controllers\OfflineCapabilityManifestController;
use App\Extensions\TitanMapsIntelligence\Http\Controllers\ProviderHealthController;
use Illuminate\Support\Facades\Route;

Route::post('/searches', [SearchController::class, 'store'])
    ->middleware('titan.maps.permission:titan-maps-intelligence.search.create')
    ->name('searches.store');
Route::get('/searches/{mapsSearch}', [SearchController::class, 'show'])
    ->middleware('titan.maps.permission:titan-maps-intelligence.search.read')
    ->name('searches.show');
Route::post('/searches/{mapsSearch}/cancel', [SearchController::class, 'cancel'])
    ->middleware('titan.maps.permission:titan-maps-intelligence.search.cancel')
    ->name('searches.cancel');
Route::post('/searches/{mapsSearch}/export', [ExportController::class, 'store'])
    ->middleware('titan.maps.permission:titan-maps-intelligence.search.export')
    ->name('searches.export');

Route::get('/candidates', [CandidateController::class, 'index'])
    ->middleware('titan.maps.permission:titan-maps-intelligence.candidate.read')
    ->name('candidates.index');
Route::get('/candidates/{mapsCandidate}', [CandidateController::class, 'show'])
    ->middleware('titan.maps.permission:titan-maps-intelligence.candidate.read')
    ->name('candidates.show');
Route::post('/candidates/{mapsCandidate}/classify', [CandidateController::class, 'classify'])
    ->middleware('titan.maps.permission:titan-maps-intelligence.candidate.classify')
    ->name('candidates.classify');
Route::post('/candidates/{mapsCandidate}/match', [CandidateController::class, 'match'])
    ->middleware('titan.maps.permission:titan-maps-intelligence.candidate.read')
    ->name('candidates.match');
Route::post('/candidates/{mapsCandidate}/approve', [CandidateController::class, 'approve'])
    ->middleware('titan.maps.permission:titan-maps-intelligence.candidate.approve')
    ->name('candidates.approve');
Route::post('/candidates/{mapsCandidate}/reject', [CandidateController::class, 'reject'])
    ->middleware('titan.maps.permission:titan-maps-intelligence.candidate.reject')
    ->name('candidates.reject');
Route::post('/candidates/{mapsCandidate}/promote', [CandidateController::class, 'promote'])
    ->middleware('titan.maps.permission:titan-maps-intelligence.candidate.promote')
    ->name('candidates.promote');

Route::post('/territories/analyse', [TerritoryController::class, 'analyse'])
    ->middleware('titan.maps.permission:titan-maps-intelligence.territory.analyse')
    ->name('territories.analyse');
Route::get('/territories/{mapsAnalysis}', [TerritoryController::class, 'show'])
    ->middleware('titan.maps.permission:titan-maps-intelligence.territory.analyse')
    ->name('territories.show');
Route::get('/usage', [UsageController::class, 'index'])
    ->middleware('titan.maps.permission:titan-maps-intelligence.usage.read')
    ->name('usage.index');

$mapsExportController = class_exists('App\\Titan\\Maps\\MapsExportController')
    ? 'App\\Titan\\Maps\\MapsExportController'
    : ExportDownloadController::class;

Route::get('/exports/{reference}', $mapsExportController)
    ->middleware(['signed', 'titan.maps.permission:titan-maps-intelligence.search.export'])
    ->name('exports.download');

Route::post('/worker-tracking/status', [WorkerTrackingController::class, 'status'])
    ->middleware('titan.maps.permission:titan-maps-intelligence.worker-location.write')
    ->name('worker-tracking.status');
Route::post('/worker-tracking/location', [WorkerTrackingController::class, 'ingest'])
    ->middleware('titan.maps.permission:titan-maps-intelligence.worker-location.write')
    ->name('worker-tracking.location');
Route::post('/worker-tracking/offline-sync', [WorkerTrackingController::class, 'offlineSync'])
    ->middleware('titan.maps.permission:titan-maps-intelligence.worker-location.write')
    ->name('worker-tracking.offline-sync');
Route::get('/worker-tracking/me', [WorkerTrackingController::class, 'me'])
    ->middleware('titan.maps.permission:titan-maps-intelligence.worker-location.write')
    ->name('worker-tracking.me');
Route::get('/worker-tracking/team', [WorkerTrackingController::class, 'team'])
    ->middleware('titan.maps.permission:titan-maps-intelligence.worker-location.read')
    ->name('worker-tracking.team');
Route::get('/worker-tracking/check-ins', [WorkerTrackingController::class, 'checkIns'])
    ->middleware('titan.maps.permission:titan-maps-intelligence.worker-location.read')
    ->name('worker-tracking.check-ins');

Route::get('/geofences', [GeofenceController::class, 'index'])->middleware('titan.maps.permission:titan-maps-intelligence.geofence.read')->name('geofences.index');
Route::post('/geofences', [GeofenceController::class, 'store'])->middleware('titan.maps.permission:titan-maps-intelligence.geofence.manage')->name('geofences.store');
Route::get('/geofence-events', [GeofenceController::class, 'events'])->middleware('titan.maps.permission:titan-maps-intelligence.geofence.read')->name('geofence-events.index');
Route::post('/geofence-events/{eventId}/confirm', [GeofenceController::class, 'confirm'])->middleware('titan.maps.permission:titan-maps-intelligence.geofence.manage')->name('geofence-events.confirm');


Route::post('/routes/calculate', [RouteSnapshotController::class, 'calculate'])
    ->middleware('titan.maps.permission:titan-maps-intelligence.route.calculate')
    ->name('routes.calculate');
Route::get('/routes', [RouteSnapshotController::class, 'index'])
    ->middleware('titan.maps.permission:titan-maps-intelligence.route.read')
    ->name('routes.index');
Route::get('/routes/{mapsRouteSnapshot}', [RouteSnapshotController::class, 'show'])
    ->middleware('titan.maps.permission:titan-maps-intelligence.route.read')
    ->name('routes.show');

Route::post('/matrices/calculate', [TravelMatrixController::class, 'calculate'])
    ->middleware('titan.maps.permission:titan-maps-intelligence.matrix.calculate')
    ->name('matrices.calculate');
Route::get('/matrices', [TravelMatrixController::class, 'history'])
    ->middleware('titan.maps.permission:titan-maps-intelligence.matrix.read')
    ->name('matrices.index');
Route::post('/nearest-resources/find', [TravelMatrixController::class, 'nearest'])
    ->middleware('titan.maps.permission:titan-maps-intelligence.nearest-resource.find')
    ->name('nearest-resources.find');

Route::post('/route-plans', [RoutePlanController::class, 'store'])->middleware('titan.maps.permission:titan-maps-intelligence.route-plan.manage')->name('route-plans.store');
Route::get('/route-plans', [RoutePlanController::class, 'history'])->middleware('titan.maps.permission:titan-maps-intelligence.route-plan.read')->name('route-plans.index');
Route::get('/route-plans/{mapsRoutePlan}', [RoutePlanController::class, 'show'])->middleware('titan.maps.permission:titan-maps-intelligence.route-plan.read')->name('route-plans.show');
Route::post('/route-plans/{mapsRoutePlan}/optimise', [RoutePlanController::class, 'optimise'])->middleware('titan.maps.permission:titan-maps-intelligence.route-plan.manage')->name('route-plans.optimise');
Route::post('/route-plans/{mapsRoutePlan}/emergency', [RoutePlanController::class, 'emergency'])->middleware('titan.maps.permission:titan-maps-intelligence.route-plan.manage')->name('route-plans.emergency');
Route::post('/route-plans/{mapsRoutePlan}/stops/{stopId}/status', [RoutePlanController::class, 'updateStopStatus'])->middleware('titan.maps.permission:titan-maps-intelligence.route-plan.manage')->name('route-plans.stop-status');



Route::post('/dispatch/recommendations', [DispatchIntelligenceController::class, 'recommend'])->middleware('titan.maps.permission:titan-maps-intelligence.dispatch.recommend')->name('dispatch.recommend');
Route::get('/dispatch/recommendations', [DispatchIntelligenceController::class, 'history'])->middleware('titan.maps.permission:titan-maps-intelligence.dispatch.read')->name('dispatch.index');
Route::get('/dispatch/recommendations/{mapsDispatchRecommendation}', [DispatchIntelligenceController::class, 'show'])->middleware('titan.maps.permission:titan-maps-intelligence.dispatch.read')->name('dispatch.show');
Route::post('/dispatch/recommendations/{mapsDispatchRecommendation}/decide', [DispatchIntelligenceController::class, 'decide'])->middleware('titan.maps.permission:titan-maps-intelligence.dispatch.manage')->name('dispatch.decide');


Route::get('/service-territories', [ServiceTerritoryController::class, 'index'])->middleware('titan.maps.permission:titan-maps-intelligence.territory.read')->name('service-territories.index');
Route::post('/service-territories', [ServiceTerritoryController::class, 'store'])->middleware('titan.maps.permission:titan-maps-intelligence.territory.manage')->name('service-territories.store');
Route::patch('/service-territories/{mapsServiceTerritory}', [ServiceTerritoryController::class, 'update'])->middleware('titan.maps.permission:titan-maps-intelligence.territory.manage')->name('service-territories.update');
Route::delete('/service-territories/{mapsServiceTerritory}', [ServiceTerritoryController::class, 'archive'])->middleware('titan.maps.permission:titan-maps-intelligence.territory.manage')->name('service-territories.archive');
Route::post('/territory-evaluations', [GeographicPricingController::class, 'evaluate'])->middleware('titan.maps.permission:titan-maps-intelligence.territory.evaluate')->name('territory-evaluations.store');
Route::get('/territory-evaluations', [GeographicPricingController::class, 'evaluations'])->middleware('titan.maps.permission:titan-maps-intelligence.territory.read')->name('territory-evaluations.index');
Route::get('/geographic-pricing-signals', [GeographicPricingController::class, 'signals'])->middleware('titan.maps.permission:titan-maps-intelligence.geographic-pricing.read')->name('geographic-pricing-signals.index');


Route::post('/territory-analytics', [TerritoryAnalyticsController::class, 'run'])->middleware('titan.maps.permission:titan-maps-intelligence.territory.analyse')->name('territory-analytics.run');
Route::get('/territory-analytics', [TerritoryAnalyticsController::class, 'index'])->middleware('titan.maps.permission:titan-maps-intelligence.territory.analyse')->name('territory-analytics.index');
Route::get('/territory-analytics/{mapsTerritoryAnalysis}', [TerritoryAnalyticsController::class, 'show'])->middleware('titan.maps.permission:titan-maps-intelligence.territory.analyse')->name('territory-analytics.show');

Route::get('/resource-fallbacks', [ResourceFallbackController::class, 'history'])->middleware('titan.maps.permission:titan-maps-intelligence.resource-fallback.read')->name('resource-fallbacks.index');
Route::post('/resource-fallbacks', [ResourceFallbackController::class, 'start'])->middleware('titan.maps.permission:titan-maps-intelligence.resource-fallback.start')->name('resource-fallbacks.store');
Route::get('/resource-fallbacks/{mapsResourceFallback}', [ResourceFallbackController::class, 'show'])->middleware('titan.maps.permission:titan-maps-intelligence.resource-fallback.read')->name('resource-fallbacks.show');
Route::post('/resource-fallbacks/{mapsResourceFallback}/refresh', [ResourceFallbackController::class, 'refresh'])->middleware('titan.maps.permission:titan-maps-intelligence.resource-fallback.read')->name('resource-fallbacks.refresh');
Route::post('/resource-fallbacks/{mapsResourceFallback}/decide', [ResourceFallbackController::class, 'decide'])->middleware('titan.maps.permission:titan-maps-intelligence.resource-fallback.decide')->name('resource-fallbacks.decide');
Route::post('/resource-fallbacks/{mapsResourceFallback}/promote', [ResourceFallbackController::class, 'promote'])->middleware('titan.maps.permission:titan-maps-intelligence.resource-fallback.promote')->name('resource-fallbacks.promote');
Route::post('/resource-fallbacks/{mapsResourceFallback}/cancel', [ResourceFallbackController::class, 'cancel'])->middleware('titan.maps.permission:titan-maps-intelligence.resource-fallback.decide')->name('resource-fallbacks.cancel');


Route::get('/offline-capabilities', OfflineCapabilityManifestController::class)->middleware('titan.maps.permission:titan-maps-intelligence.capabilities.read')->name('offline-capabilities.index');

Route::get('/providers/{provider}/health', [ProviderHealthController::class, 'show'])->middleware('titan.maps.permission:titan-maps-intelligence.provider-health.read')->name('providers.health');
