<?php
namespace App\Extensions\TitanBuilder\System\Registries;
use App\Extensions\TitanBuilder\System\Contracts\ComponentRegistry;
use App\Extensions\TitanBuilder\System\GenerativeUI\BuilderRegistry;
final class JsonComponentRegistry implements ComponentRegistry {
    public function __construct(private readonly BuilderRegistry $registry) {}
    public function all(): array { return $this->registry->all('components'); }
    public function find(string $id): ?array { return $this->registry->find('components', $id); }
    public function ids(): array { return $this->registry->componentIds(); }
}
