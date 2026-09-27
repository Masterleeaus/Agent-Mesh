<?php
declare(strict_types=1);
namespace App\Extensions\TitanVisualRuntime\System\Contracts;
interface VisualContributionVersionPolicy {
    public function compare(string $incoming,string $existing): int;
    public function assertCompatible(string $version): void;
}
