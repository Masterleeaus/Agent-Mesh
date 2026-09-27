<?php
namespace App\Extensions\TitanBuilder\System\Registries;
use App\Extensions\TitanBuilder\System\Contracts\TemplateRegistry;
use App\Extensions\TitanBuilder\System\GenerativeUI\BuilderRegistry;
final class JsonTemplateRegistry implements TemplateRegistry {
    public function __construct(private readonly BuilderRegistry $registry) {}
    public function all(): array { return $this->registry->all('templates'); }
    public function find(string $id): ?array { return $this->registry->find('templates', $id); }
    public function ids(): array { return array_values(array_filter(array_map(static fn(array $v): ?string => is_string($v['id'] ?? null) ? $v['id'] : null, $this->all()))); }
}
