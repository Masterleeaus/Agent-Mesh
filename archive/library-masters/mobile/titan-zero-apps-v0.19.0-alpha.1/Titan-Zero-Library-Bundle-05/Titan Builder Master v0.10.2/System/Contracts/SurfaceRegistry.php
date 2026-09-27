<?php
namespace App\Extensions\TitanBuilder\System\Contracts;
interface SurfaceRegistry { public function all(): array; public function find(string $id): ?array; public function ids(): array; }
