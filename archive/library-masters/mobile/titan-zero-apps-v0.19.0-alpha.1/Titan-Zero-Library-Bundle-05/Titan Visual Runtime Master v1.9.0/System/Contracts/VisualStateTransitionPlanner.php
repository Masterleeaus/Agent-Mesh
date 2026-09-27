<?php
namespace App\Extensions\TitanVisualRuntime\System\Contracts;
interface VisualStateTransitionPlanner { public function plan(string $from, string $to, array $environment = []): array; }
