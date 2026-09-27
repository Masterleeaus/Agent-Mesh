<?php
declare(strict_types=1); namespace App\Extensions\TitanVisualRuntime\System\Runtime;
use App\Extensions\TitanVisualRuntime\System\Contracts\{AssetResolver,VisualEnvironment};
final class RoleAssetResolver implements AssetResolver { public function __construct(private readonly InMemoryVisualResourceRegistry $r){} public function resolve(string $role,VisualEnvironment $e,array $context=[]): ?array { return $this->r->resolveAsset($role,$e,$context); } }
