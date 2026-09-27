<?php

declare(strict_types=1);

namespace App\Extensions\InteractionEngine\System\Engines\Executive\Contracts;

interface EscalationEngineInterface
{
    public function escalate(string $issue, array $context): void;
    public function getEscalations(): array;
    public function resolve(string $id, array $resolution): void;
    public function getEscalationPolicy(): array;
}
