<?php
declare(strict_types=1);
namespace App\Extensions\TitanVisualRuntime\System\Contracts;
interface VisualResourceFreshnessPolicy { public function evaluate(array $resource,int $now): array; }
