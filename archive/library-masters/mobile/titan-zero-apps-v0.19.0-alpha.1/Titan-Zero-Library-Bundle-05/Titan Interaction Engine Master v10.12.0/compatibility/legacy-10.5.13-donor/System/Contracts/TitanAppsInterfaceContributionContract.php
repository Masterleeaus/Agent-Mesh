<?php

declare(strict_types=1);

namespace App\Extensions\InteractionEngine\System\Contracts;

/**
 * Stable platform-facing boundary for semantic UI contributions.
 *
 * Providers/Workforce may propose semantic components/actions only. This contract
 * never renders executable UI and never grants execution authority. Interface
 * Runtime owns composition/rendering; Builder owns editing/publishing.
 */
interface TitanAppsInterfaceContributionContract
{
    /** @param array<string,mixed> $structuredOutput @param array<string,mixed> $trustedContext */
    public function normalize(array $structuredOutput, array $trustedContext): array;
}
