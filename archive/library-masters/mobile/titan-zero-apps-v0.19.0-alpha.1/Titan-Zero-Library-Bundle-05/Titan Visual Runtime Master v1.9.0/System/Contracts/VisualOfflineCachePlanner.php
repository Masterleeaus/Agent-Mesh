<?php
declare(strict_types=1);
namespace App\Extensions\TitanVisualRuntime\System\Contracts;
interface VisualOfflineCachePlanner {
    public function plan(array $resources, VisualEnvironment $environment, ?int $budgetBytes=null): array;
}
