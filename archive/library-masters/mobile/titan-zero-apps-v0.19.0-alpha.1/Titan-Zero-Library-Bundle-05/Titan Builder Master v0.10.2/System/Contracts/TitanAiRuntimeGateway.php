<?php

declare(strict_types=1);

namespace App\Extensions\TitanBuilder\System\Contracts;

/** Host bridge implemented by the standalone TitanAI Runtime extension. */
interface TitanAiRuntimeGateway
{
    /** @return array<string,mixed> structured Builder proposal only */
    public function proposeBuilderSpec(string $prompt, array $context): array;
}
