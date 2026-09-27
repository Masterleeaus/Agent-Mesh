<?php
declare(strict_types=1);
namespace App\Extensions\TitanVisualRuntime\System\Contracts;
interface VisualCapabilityNegotiator {
    /** @return array{required:list<string>,available:list<string>,missing:list<string>,strategy:string} */
    public function negotiate(array $requirements, VisualEnvironment $environment): array;
}
