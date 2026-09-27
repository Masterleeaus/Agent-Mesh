<?php

declare(strict_types=1);

namespace App\Extensions\InteractionEngine\System\Contracts;

/**
 * Stable platform-facing Titan Apps interaction boundary.
 * Consumers must not depend on Interaction Engine router/wizard/command internals.
 */
interface TitanAppsInteractionContract
{
    /** Non-mutating interpretation/classification boundary. */
    public function interpret(string $message, array $trustedContext = []): array;

    public function prepareJourney(string $capability, ?string $workflowKey, array $trustedContext): array;

    public function dispatch(string $capability, array $payload): array;
}
