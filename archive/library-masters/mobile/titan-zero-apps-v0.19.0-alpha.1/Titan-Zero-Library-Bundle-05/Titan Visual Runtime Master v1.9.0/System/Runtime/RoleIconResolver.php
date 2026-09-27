<?php
declare(strict_types=1); namespace App\Extensions\TitanVisualRuntime\System\Runtime;
use App\Extensions\TitanVisualRuntime\System\Contracts\{IconResolver,VisualEnvironment};
final class RoleIconResolver implements IconResolver { public function __construct(private readonly InMemoryVisualResourceRegistry $r){} public function resolve(string $role,VisualEnvironment $e,array $context=[]): ?array { return $this->r->resolveIcon($role,$e,$context); } }
