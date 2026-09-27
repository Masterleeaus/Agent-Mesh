<?php

declare(strict_types=1);
$root = dirname(__DIR__);
$errors = [];
$required = [
    'DTO/DispatchScoreResult.php','DTO/DispatchJobContext.php','Contracts/DispatchEvidenceGateway.php','Contracts/DispatchAssignmentGateway.php',
    'Services/DispatchScoreService.php','Services/DispatchIntelligenceService.php','Services/CrmDispatchEvidenceGateway.php','Services/UnavailableDispatchAssignmentGateway.php',
    'Models/DispatchRecommendation.php','Models/DispatchCandidate.php','Models/DispatchDecision.php','Http/Controllers/DispatchIntelligenceController.php',
    'Tools/RecommendDispatchTool.php','Tools/ReadDispatchRecommendationsTool.php','Tools/DecideDispatchRecommendationTool.php',
];
foreach ($required as $path) if (!is_file($root.'/'.$path)) $errors[] = "missing {$path}";
$migrations = glob($root.'/database/migrations/*dispatch*.php') ?: [];
if (count($migrations) < 3) $errors[] = 'expected at least 3 dispatch schema migrations';
$userRoutes = @file_get_contents($root.'/routes/user.php') ?: '';
foreach (['field/dispatch','dispatch.recommend','dispatch.decide'] as $needle) if (!str_contains($userRoutes,$needle)) $errors[] = "user route missing {$needle}";
$apiRoutes = @file_get_contents($root.'/routes/api.php') ?: '';
foreach (['dispatch/recommendations','dispatch.recommend','dispatch.decide'] as $needle) if (!str_contains($apiRoutes,$needle)) $errors[] = "api route missing {$needle}";
$menu = @file_get_contents($root.'/System/Navigation/MapsMenuDefinition.php') ?: '';
if (!str_contains($menu,"'Dispatch Intelligence'")) $errors[] = 'navigation missing Dispatch Intelligence';
$cap = @file_get_contents($root.'/Services/MapsCapabilityService.php') ?: '';
foreach (['dispatch.recommend','dispatch.read','dispatch.decide'] as $needle) if (!str_contains($cap,$needle)) $errors[] = "capability missing {$needle}";
$manifest = json_decode((string)@file_get_contents($root.'/extension.manifest.json'),true) ?: [];
foreach (['titan-maps-intelligence.dispatch.recommend','titan-maps-intelligence.dispatch.read','titan-maps-intelligence.dispatch.decide'] as $id) if (!in_array($id,$manifest['capabilities']??[],true)) $errors[] = "manifest missing {$id}";
$service = @file_get_contents($root.'/Services/DispatchIntelligenceService.php') ?: '';
foreach (['TravelMatrixService','MapWorkerTrackingState','pending_approval','DispatchScoreService'] as $needle) if (!str_contains($service,$needle)) $errors[] = "dispatch orchestration missing {$needle}";
$decisionTool = @file_get_contents($root.'/Tools/DecideDispatchRecommendationTool.php') ?: '';
foreach (['confirmed','MAPS_CONFIRMATION_REQUIRED','dispatch.manage'] as $needle) if (!str_contains($decisionTool,$needle)) $errors[] = "dispatch decision confirmation invariant missing {$needle}";
foreach (['MAPS_DISPATCH_RECOMMENDATION_EXPIRED', "status!=='pending_approval'"] as $needle) if (!str_contains($service,$needle)) $errors[] = "dispatch decision state invariant missing {$needle}";
$ui = @file_get_contents($root.'/resources/views/user/navigation.blade.php') ?: '';
foreach (['data-titan-dispatch-form','Approve and assign'] as $needle) if (!str_contains($ui,$needle)) $errors[] = "dispatch UI invariant missing {$needle}";
$navigation = @file_get_contents($root.'/Http/Controllers/UserNavigationController.php') ?: '';
if (!str_contains($navigation,'Unknown qualification or certification evidence remains unknown')) $errors[] = 'dispatch unknown-evidence status note missing';
$map = @file_get_contents($root.'/resources/js/titan-map-engine.js') ?: '';
if (!str_contains($map,'setDispatchRecommendation')) $errors[] = 'dispatch graphical map integration missing';
if ($errors) { fwrite(STDERR,"Dispatch intelligence verification FAILED\n - ".implode("\n - ",$errors)."\n"); exit(1); }
echo "Dispatch intelligence verification: PASS\n";
