<?php
namespace App\Extensions\TitanBuilder\System\Contracts;
interface ThemeRegistry { public function all(): array; public function find(string $id): ?array; public function ids(): array; }
