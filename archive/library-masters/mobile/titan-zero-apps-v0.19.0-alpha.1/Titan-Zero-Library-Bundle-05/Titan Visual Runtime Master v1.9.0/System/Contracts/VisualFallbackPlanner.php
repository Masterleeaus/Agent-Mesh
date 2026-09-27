<?php
declare(strict_types=1);
namespace App\Extensions\TitanVisualRuntime\System\Contracts;
interface VisualFallbackPlanner {
    /** @return array{treatment:string,reason:string,degraded:bool} */
    public function fallback(array $request, VisualEnvironment $environment, VisualPreferences $preferences, array $negotiation): array;
}
