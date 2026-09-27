<?php

declare(strict_types=1);

namespace App\Extensions\InteractionEngine\System\Engines\AIInfrastructure\Contracts;

interface GuardrailEngineInterface
{
    public function validate(string $input, string $context): bool;
    public function enforce(string $input): string;
    public function listGuardrails(): array;
}
