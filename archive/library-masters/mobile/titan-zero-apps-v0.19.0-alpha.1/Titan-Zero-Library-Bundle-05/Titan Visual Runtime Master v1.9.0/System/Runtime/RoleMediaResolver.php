<?php
declare(strict_types=1); namespace App\Extensions\TitanVisualRuntime\System\Runtime;
use App\Extensions\TitanVisualRuntime\System\Contracts\{MediaResolver,VisualEnvironment};
final class RoleMediaResolver implements MediaResolver { public function __construct(private readonly InMemoryVisualResourceRegistry $r){} public function resolve(string $role,VisualEnvironment $e,array $context=[]): ?array { return $this->r->resolveMedia($role,$e,$context); } }
