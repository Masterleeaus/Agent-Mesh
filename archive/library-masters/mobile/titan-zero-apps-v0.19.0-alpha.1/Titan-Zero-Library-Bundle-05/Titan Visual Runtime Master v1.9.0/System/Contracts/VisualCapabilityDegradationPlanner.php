<?php
declare(strict_types=1);
namespace App\Extensions\TitanVisualRuntime\System\Contracts;
interface VisualCapabilityDegradationPlanner { public function plan(array $preferred,array $available): array; }
