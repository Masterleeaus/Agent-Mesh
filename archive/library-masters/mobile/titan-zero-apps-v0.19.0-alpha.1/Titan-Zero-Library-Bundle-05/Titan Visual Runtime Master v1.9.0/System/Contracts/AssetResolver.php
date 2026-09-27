<?php
declare(strict_types=1);
namespace App\Extensions\TitanVisualRuntime\System\Contracts;
interface AssetResolver { public function resolve(string $role, VisualEnvironment $environment, array $context=[]): ?array; }
