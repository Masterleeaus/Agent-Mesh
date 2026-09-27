<?php

declare(strict_types=1);

require_once __DIR__.'/../System/Contracts/InteractionContext.php';
require_once __DIR__.'/../System/Contracts/PresentationIntent.php';
require_once __DIR__.'/../System/Contracts/PresentationIntentPlannerInterface.php';
require_once __DIR__.'/../System/Presentation/PresentationIntentGuard.php';
require_once __DIR__.'/../System/Presentation/DeterministicPresentationIntentPlanner.php';

use App\Extensions\InteractionEngine\System\Contracts\InteractionContext;
use App\Extensions\InteractionEngine\System\Presentation\DeterministicPresentationIntentPlanner;
use App\Extensions\InteractionEngine\System\Presentation\PresentationIntentGuard;

$planner = new DeterministicPresentationIntentPlanner(new PresentationIntentGuard());
$context = new InteractionContext('company-1', 'actor-1', 'go');
$intent = $planner->plan($context, 'field.job.view', [
    'semantic_components' => ['field.job.detail'],
    'data_requirements' => ['field.job.worker_projection'],
    'visual_hints' => ['treatment' => 'go.field.default'],
    'actions' => [['intent' => 'field.job.start']],
]);
assert($intent->surface === 'go');

foreach ([
    ['semantic_components' => ['<script>alert(1)</script>']],
    ['visual_hints' => ['javascript' => 'alert(1)']],
    ['data_requirements' => [['raw_sql' => 'drop table users']]],
    ['actions' => [['intent' => 'field.job.start', 'credentials' => 'secret']]],
] as $bad) {
    $thrown = false;
    try { $planner->plan($context, 'field.job.view', $bad); } catch (InvalidArgumentException) { $thrown = true; }
    assert($thrown === true);
}

echo "apps_suite_presentation_guard: PASS\n";
