<?php

declare(strict_types=1);
namespace App\Extensions\InteractionEngine\System;
use App\Extensions\InteractionEngine\System\Contracts\InteractionContext;use App\Extensions\InteractionEngine\System\Contracts\PresentationIntent;use App\Extensions\InteractionEngine\System\Contracts\PresentationIntentPlannerInterface;use App\Extensions\InteractionEngine\System\Contracts\PublicInteractionEngineInterface;use App\Extensions\InteractionEngine\System\Surfaces\SurfaceWizardPolicy;
final class PublicInteractionEngine implements PublicInteractionEngineInterface{public function __construct(private SurfaceWizardPolicy $surfaces,private PresentationIntentPlannerInterface $planner){}public function canonicalSurface(string $surface):string{return$this->surfaces->canonicalSurface($surface);}public function presentationIntent(InteractionContext $context,string $intent,array $facts=[]):PresentationIntent{return$this->planner->plan($context,$intent,$facts);}}
