<?php
namespace App\Extensions\TitanVisualRuntime\System\Contracts;
interface VisualContributionResolver { public function resolve(string $slot, array $contributions): ?array; }
