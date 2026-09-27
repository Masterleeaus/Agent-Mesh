<?php
declare(strict_types=1);
namespace App\Extensions\TitanVisualRuntime\System\Contracts;
interface VisualContributionSource {
    public function providerId(): string;
    /** @return list<array<string,mixed>> */
    public function visualContributions(): array;
}
