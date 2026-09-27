<?php

declare(strict_types=1);
namespace App\Extensions\InteractionEngine\System\Contracts;
interface PresentationIntentPlannerInterface{public function plan(InteractionContext $context,string $intent,array $facts=[]):PresentationIntent;}
