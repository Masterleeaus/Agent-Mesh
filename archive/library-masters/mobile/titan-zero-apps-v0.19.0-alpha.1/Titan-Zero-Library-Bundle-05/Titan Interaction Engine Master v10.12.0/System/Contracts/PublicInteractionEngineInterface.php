<?php

declare(strict_types=1);
namespace App\Extensions\InteractionEngine\System\Contracts;
interface PublicInteractionEngineInterface{public function canonicalSurface(string $surface):string;public function presentationIntent(InteractionContext $context,string $intent,array $facts=[]):PresentationIntent;}
