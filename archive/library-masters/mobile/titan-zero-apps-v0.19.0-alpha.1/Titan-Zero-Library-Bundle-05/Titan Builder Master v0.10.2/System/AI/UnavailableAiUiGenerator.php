<?php
namespace App\Extensions\TitanBuilder\System\AI;
use App\Extensions\TitanBuilder\System\Contracts\AiUiGenerator;
use LogicException;
final class UnavailableAiUiGenerator implements AiUiGenerator {
    public function propose(string $prompt, array $context = []): array {
        throw new LogicException('No TitanAI adapter is bound. Titan Builder does not own AI orchestration.');
    }
}
