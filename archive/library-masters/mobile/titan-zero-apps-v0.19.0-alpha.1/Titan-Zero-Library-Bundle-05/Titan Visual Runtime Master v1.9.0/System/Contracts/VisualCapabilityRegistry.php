<?php
declare(strict_types=1);
namespace App\Extensions\TitanVisualRuntime\System\Contracts;
interface VisualCapabilityRegistry { public function all(): array; public function supports(string $capability, VisualEnvironment $environment): bool; }
