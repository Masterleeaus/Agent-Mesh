<?php
namespace App\Extensions\TitanBuilder\System\Contracts;
interface AiUiGenerator { public function propose(string $prompt, array $context = []): array; }
