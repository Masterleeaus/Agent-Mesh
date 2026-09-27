<?php
declare(strict_types=1);
namespace App\Extensions\TitanVisualRuntime\System\Contracts;

interface InterfaceRuntimeBridgeCompatibility
{
    public function normalizeRequest(array $request): array;
    public function profile(): array;
}
