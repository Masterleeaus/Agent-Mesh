<?php

declare(strict_types=1);

use App\Extensions\TitanMapsIntelligence\Http\Controllers\MapAssetController;
use App\Extensions\TitanMapsIntelligence\Http\Controllers\UserDashboardController;
use App\Extensions\TitanMapsIntelligence\Http\Controllers\UserNavigationController;
use App\Extensions\TitanMapsIntelligence\Http\Controllers\TravelRouteController;
use App\Extensions\TitanMapsIntelligence\Http\Controllers\WorkerTrackingController;
use App\Extensions\TitanMapsIntelligence\Http\Controllers\GeofenceController;
use App\Extensions\TitanMapsIntelligence\Http\Controllers\RouteSnapshotController;
use App\Extensions\TitanMapsIntelligence\Http\Controllers\TravelMatrixController;
use App\Extensions\TitanMapsIntelligence\Http\Controllers\RoutePlanController;
use App\Extensions\TitanMapsIntelligence\Http\Controllers\DispatchIntelligenceController;
use App\Extensions\TitanMapsIntelligence\Http\Controllers\ServiceTerritoryController;
use App\Extensions\TitanMapsIntelligence\Http\Controllers\GeographicPricingController;
use App\Extensions\TitanMapsIntelligence\Http\Controllers\TerritoryAnalyticsController;
use App\Extensions\TitanMapsIntelligence\Http\Controllers\ResourceFallbackController;
use Illuminate\Support\Facades\Route;


Route::get('/assets/{asset}', MapAssetController::class)
    ->where('asset', 'titan-map-engine\.js|titan-map-engine\.css|titan-maps-intelligence\.js')
    ->name('assets.show');

Route::get('/', UserDashboardController::class)
    ->middleware('titan.maps.permission:titan-maps-intelligence.search.read')
    ->name('index');

$read = 'titan.maps.permission:titan-maps-intelligence.search.read';
$candidates = 'titan.maps.permission:titan-maps-intelligence.candidate.read';
$territory = 'titan.maps.permission:titan-maps-intelligence.territory.analyse';
$usage = 'titan.maps.permission:titan-maps-intelligence.usage.read';
$provider = 'titan.maps.permission:titan-maps-intelligence.provider.manage';
$routeRead = 'titan.maps.permission:titan-maps-intelligence.route.read';

Route::get('/field', UserNavigationController::class)->defaults('maps_page', 'field.index')->middleware($read)->name('field.index');
Route::get('/field/locations', UserNavigationController::class)->defaults('maps_page', 'field.locations')->middleware($read)->name('field.locations');
Route::get('/field/team', UserNavigationController::class)->defaults('maps_page', 'field.team')->middleware('titan.maps.permission:titan-maps-intelligence.worker-location.read')->name('field.team');
Route::get('/field/team/data', [WorkerTrackingController::class, 'team'])->middleware('titan.maps.permission:titan-maps-intelligence.worker-location.read')->name('field.team.data');
Route::get('/field/dispatch', UserNavigationController::class)->defaults('maps_page', 'field.dispatch')->middleware('titan.maps.permission:titan-maps-intelligence.dispatch.read')->name('field.dispatch');

Route::get('/field/resource-fallback', [ResourceFallbackController::class, 'index'])->middleware('titan.maps.permission:titan-maps-intelligence.resource-fallback.read')->name('field.resource-fallback');
Route::post('/field/resource-fallback/start', [ResourceFallbackController::class, 'start'])->middleware('titan.maps.permission:titan-maps-intelligence.resource-fallback.start')->name('field.resource-fallback.start');
Route::post('/field/resource-fallback/{mapsResourceFallback}/refresh', [ResourceFallbackController::class, 'refresh'])->middleware('titan.maps.permission:titan-maps-intelligence.resource-fallback.read')->name('field.resource-fallback.refresh');
Route::post('/field/resource-fallback/{mapsResourceFallback}/decide', [ResourceFallbackController::class, 'decide'])->middleware('titan.maps.permission:titan-maps-intelligence.resource-fallback.decide')->name('field.resource-fallback.decide');
Route::post('/field/resource-fallback/{mapsResourceFallback}/promote', [ResourceFallbackController::class, 'promote'])->middleware('titan.maps.permission:titan-maps-intelligence.resource-fallback.promote')->name('field.resource-fallback.promote');
Route::post('/field/resource-fallback/{mapsResourceFallback}/cancel', [ResourceFallbackController::class, 'cancel'])->middleware('titan.maps.permission:titan-maps-intelligence.resource-fallback.decide')->name('field.resource-fallback.cancel');

Route::post('/field/dispatch/recommend', [DispatchIntelligenceController::class, 'recommend'])->middleware('titan.maps.permission:titan-maps-intelligence.dispatch.recommend')->name('field.dispatch.recommend');
Route::get('/field/dispatch/recommendations/{mapsDispatchRecommendation}', [DispatchIntelligenceController::class, 'show'])->middleware('titan.maps.permission:titan-maps-intelligence.dispatch.read')->name('field.dispatch.show');
Route::post('/field/dispatch/recommendations/{mapsDispatchRecommendation}/decide', [DispatchIntelligenceController::class, 'decide'])->middleware('titan.maps.permission:titan-maps-intelligence.dispatch.manage')->name('field.dispatch.decide');
Route::get('/field/geofences', UserNavigationController::class)->defaults('maps_page', 'field.geofences')->middleware($read)->name('field.geofences');
Route::post('/field/geofences', [GeofenceController::class, 'store'])->middleware('titan.maps.permission:titan-maps-intelligence.geofence.manage')->name('field.geofences.store');
Route::post('/field/geofence-events/{eventId}/confirm', [GeofenceController::class, 'confirm'])->middleware('titan.maps.permission:titan-maps-intelligence.geofence.manage')->name('field.geofence-events.confirm');
Route::get('/field/check-ins', UserNavigationController::class)->defaults('maps_page', 'field.checkins')->middleware('titan.maps.permission:titan-maps-intelligence.worker-location.read')->name('field.checkins');

Route::get('/location-intelligence', UserNavigationController::class)->defaults('maps_page', 'location.index')->middleware($read)->name('location.index');
Route::get('/location-intelligence/discovery', UserNavigationController::class)->defaults('maps_page', 'location.discovery')->middleware($read)->name('location.discovery');
Route::get('/location-intelligence/candidates', UserNavigationController::class)->defaults('maps_page', 'location.candidates')->middleware($candidates)->name('location.candidates');
Route::get('/location-intelligence/suppliers', UserNavigationController::class)->defaults('maps_page', 'location.suppliers')->middleware($candidates)->name('location.suppliers');
Route::get('/location-intelligence/contractors', UserNavigationController::class)->defaults('maps_page', 'location.contractors')->middleware($candidates)->name('location.contractors');
Route::get('/location-intelligence/competitors', UserNavigationController::class)->defaults('maps_page', 'location.competitors')->middleware($candidates)->name('location.competitors');
Route::get('/location-intelligence/nearby', UserNavigationController::class)->defaults('maps_page', 'location.nearby')->middleware($read)->name('location.nearby');

Route::get('/territories', UserNavigationController::class)->defaults('maps_page', 'territories.index')->middleware($territory)->name('territories.index');
Route::get('/territories/service-areas', UserNavigationController::class)->defaults('maps_page', 'territories.service-areas')->middleware('titan.maps.permission:titan-maps-intelligence.territory.read')->name('territories.service-areas');
Route::post('/territories/service-areas', [ServiceTerritoryController::class, 'store'])->middleware('titan.maps.permission:titan-maps-intelligence.territory.manage')->name('territories.service-areas.store');
Route::get('/territories/travel-zones', UserNavigationController::class)->defaults('maps_page', 'territories.travel-zones')->middleware('titan.maps.permission:titan-maps-intelligence.territory.read')->name('territories.travel-zones');
Route::post('/territories/travel-zones', [ServiceTerritoryController::class, 'store'])->middleware('titan.maps.permission:titan-maps-intelligence.territory.manage')->name('territories.travel-zones.store');
Route::get('/territories/geographic-pricing', UserNavigationController::class)->defaults('maps_page', 'territories.geographic-pricing')->middleware('titan.maps.permission:titan-maps-intelligence.geographic-pricing.read')->name('territories.geographic-pricing');
Route::post('/territories/geographic-pricing/evaluate', [GeographicPricingController::class, 'evaluate'])->middleware('titan.maps.permission:titan-maps-intelligence.territory.evaluate')->name('territories.geographic-pricing.evaluate');
Route::get('/territories/analysis', UserNavigationController::class)->defaults('maps_page', 'territories.analysis')->middleware($territory)->name('territories.analysis');
Route::get('/territories/providers', UserNavigationController::class)->defaults('maps_page', 'territories.providers')->middleware($territory)->name('territories.providers');
Route::get('/territories/competitors', UserNavigationController::class)->defaults('maps_page', 'territories.competitors')->middleware($territory)->name('territories.competitors');
Route::get('/territories/suppliers', UserNavigationController::class)->defaults('maps_page', 'territories.suppliers')->middleware($territory)->name('territories.suppliers');
Route::get('/territories/gaps', UserNavigationController::class)->defaults('maps_page', 'territories.gaps')->middleware($territory)->name('territories.gaps');
Route::get('/territories/branch-coverage', UserNavigationController::class)->defaults('maps_page', 'territories.branch-coverage')->middleware($territory)->name('territories.branch-coverage');
Route::get('/territories/expansion-opportunities', UserNavigationController::class)->defaults('maps_page', 'territories.expansion-opportunities')->middleware($territory)->name('territories.expansion-opportunities');
Route::post('/territories/analytics/run', [TerritoryAnalyticsController::class, 'run'])->middleware($territory)->name('territories.analytics.run');
Route::get('/territories/analytics/{mapsTerritoryAnalysis}', [TerritoryAnalyticsController::class, 'show'])->middleware($territory)->name('territories.analytics.show');

Route::get('/travel', UserNavigationController::class)->defaults('maps_page', 'travel.index')->middleware($routeRead)->name('travel.index');
Route::get('/travel/route', UserNavigationController::class)->defaults('maps_page', 'travel.route')->middleware($routeRead)->name('travel.route');
Route::post('/travel/route/calculate', TravelRouteController::class)->middleware('titan.maps.permission:titan-maps-intelligence.route.calculate')->name('travel.route.calculate');
Route::get('/travel/route/history', [RouteSnapshotController::class, 'index'])->middleware('titan.maps.permission:titan-maps-intelligence.route.read')->name('travel.route.history');
Route::get('/travel/matrix', UserNavigationController::class)->defaults('maps_page', 'travel.matrix')->middleware($routeRead)->name('travel.matrix');
Route::post('/travel/matrix/calculate', [TravelMatrixController::class, 'calculate'])->middleware('titan.maps.permission:titan-maps-intelligence.matrix.calculate')->name('travel.matrix.calculate');
Route::post('/travel/matrix/nearest', [TravelMatrixController::class, 'nearest'])->middleware('titan.maps.permission:titan-maps-intelligence.nearest-resource.find')->name('travel.matrix.nearest');
Route::get('/travel/matrix/history', [TravelMatrixController::class, 'history'])->middleware('titan.maps.permission:titan-maps-intelligence.matrix.read')->name('travel.matrix.history');
Route::get('/travel/planner', UserNavigationController::class)->defaults('maps_page', 'travel.planner')->middleware('titan.maps.permission:titan-maps-intelligence.route-plan.read')->name('travel.planner');
Route::post('/travel/planner', [RoutePlanController::class, 'store'])->middleware('titan.maps.permission:titan-maps-intelligence.route-plan.manage')->name('travel.planner.store');
Route::get('/travel/planner/{mapsRoutePlan}', [RoutePlanController::class, 'show'])->middleware('titan.maps.permission:titan-maps-intelligence.route-plan.read')->name('travel.planner.show');
Route::post('/travel/planner/{mapsRoutePlan}/optimise', [RoutePlanController::class, 'optimise'])->middleware('titan.maps.permission:titan-maps-intelligence.route-plan.manage')->name('travel.planner.optimise');
Route::post('/travel/planner/{mapsRoutePlan}/emergency', [RoutePlanController::class, 'emergency'])->middleware('titan.maps.permission:titan-maps-intelligence.route-plan.manage')->name('travel.planner.emergency');
Route::post('/travel/planner/{mapsRoutePlan}/stops/{stopId}/status', [RoutePlanController::class, 'updateStopStatus'])->middleware('titan.maps.permission:titan-maps-intelligence.route-plan.manage')->name('travel.planner.stop-status');
Route::get('/travel/planner-history', [RoutePlanController::class, 'history'])->middleware('titan.maps.permission:titan-maps-intelligence.route-plan.read')->name('travel.planner.history');
Route::get('/travel/traffic', UserNavigationController::class)->defaults('maps_page', 'travel.traffic')->middleware($routeRead)->name('travel.traffic');

Route::get('/settings', UserNavigationController::class)->defaults('maps_page', 'settings.index')->middleware($read)->name('settings.index');
Route::get('/settings/providers', UserNavigationController::class)->defaults('maps_page', 'settings.providers')->middleware($provider)->name('settings.providers');
Route::get('/settings/routing', UserNavigationController::class)->defaults('maps_page', 'settings.routing')->middleware($provider)->name('settings.routing');
Route::get('/settings/tracking', UserNavigationController::class)->defaults('maps_page', 'settings.tracking')->middleware($read)->name('settings.tracking');
Route::get('/settings/privacy', UserNavigationController::class)->defaults('maps_page', 'settings.privacy')->middleware($read)->name('settings.privacy');
Route::get('/settings/usage', UserNavigationController::class)->defaults('maps_page', 'settings.usage')->middleware($usage)->name('settings.usage');
