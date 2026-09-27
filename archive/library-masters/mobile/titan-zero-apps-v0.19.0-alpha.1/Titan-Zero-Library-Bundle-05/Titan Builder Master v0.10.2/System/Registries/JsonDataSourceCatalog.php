<?php
namespace App\Extensions\TitanBuilder\System\Registries;
use App\Extensions\TitanBuilder\System\Contracts\DataSourceCatalog;
use App\Extensions\TitanBuilder\System\GenerativeUI\BuilderRegistry;
final class JsonDataSourceCatalog implements DataSourceCatalog {
    public function __construct(private readonly BuilderRegistry $registry) {}
    public function all(): array { return $this->registry->all('data-sources'); }
    public function find(string $id): ?array { return $this->registry->find('data-sources', $id); }
    public function has(string $id): bool { return $this->find($id) !== null; }
}
