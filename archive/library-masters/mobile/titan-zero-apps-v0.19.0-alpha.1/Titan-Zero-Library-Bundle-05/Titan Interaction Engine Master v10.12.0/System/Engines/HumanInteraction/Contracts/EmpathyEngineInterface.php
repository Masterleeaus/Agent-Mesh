<?php

declare(strict_types=1);

namespace App\Extensions\InteractionEngine\System\Engines\HumanInteraction\Contracts;

interface EmpathyEngineInterface
{
    public function generateResponse(string $input): string;
    public function getEmpathyScore(string $input): float;
    public function listEmpathyStrategies(): array;
}
