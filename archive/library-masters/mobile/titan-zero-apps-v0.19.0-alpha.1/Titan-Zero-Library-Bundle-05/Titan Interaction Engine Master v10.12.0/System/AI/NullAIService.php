<?php

declare(strict_types=1);

namespace App\Extensions\InteractionEngine\System\AI;

final class NullAIService implements AIServiceInterface
{
    public function generate(string $prompt, array $options = []): string
    {
        throw new \RuntimeException('External AI is not part of this offline build. LocalBrain v2 remains available.');
    }
}
