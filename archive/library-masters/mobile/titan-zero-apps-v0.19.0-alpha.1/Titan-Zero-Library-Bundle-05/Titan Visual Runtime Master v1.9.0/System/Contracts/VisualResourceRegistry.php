<?php
declare(strict_types=1);
namespace App\Extensions\TitanVisualRuntime\System\Contracts;
interface VisualResourceRegistry {
    public function registerAsset(string $role,array $definition): void;
    public function registerIcon(string $role,array $definition): void;
    public function registerMedia(string $role,array $definition): void;
    public function resolveAsset(string $role,VisualEnvironment $environment,array $context=[]): ?array;
    public function resolveIcon(string $role,VisualEnvironment $environment,array $context=[]): ?array;
    public function resolveMedia(string $role,VisualEnvironment $environment,array $context=[]): ?array;
    public function inventory(): array;
}
