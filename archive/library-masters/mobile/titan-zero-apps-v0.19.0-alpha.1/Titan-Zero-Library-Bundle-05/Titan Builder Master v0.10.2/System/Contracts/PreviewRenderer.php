<?php
namespace App\Extensions\TitanBuilder\System\Contracts;
interface PreviewRenderer { public function render(array $spec, array $context = []): array; }
