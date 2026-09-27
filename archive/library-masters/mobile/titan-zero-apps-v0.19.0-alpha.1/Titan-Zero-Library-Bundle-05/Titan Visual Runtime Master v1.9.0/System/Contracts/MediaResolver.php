<?php
declare(strict_types=1);
namespace App\Extensions\TitanVisualRuntime\System\Contracts;
interface MediaResolver { public function resolve(string $role, VisualEnvironment $environment, array $context=[]): ?array; }
