<?php
namespace App\Extensions\TitanBuilder\System\Contracts;
interface ActionCatalog { public function all(): array; public function find(string $id): ?array; public function has(string $id): bool; }
