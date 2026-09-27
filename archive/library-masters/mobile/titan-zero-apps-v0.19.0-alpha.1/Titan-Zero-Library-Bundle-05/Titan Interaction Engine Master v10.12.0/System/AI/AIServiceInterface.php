<?php

declare(strict_types=1);

namespace App\Extensions\InteractionEngine\System\AI;

interface AIServiceInterface
{
    public function generate(string $prompt, array $options = []): string;
}
