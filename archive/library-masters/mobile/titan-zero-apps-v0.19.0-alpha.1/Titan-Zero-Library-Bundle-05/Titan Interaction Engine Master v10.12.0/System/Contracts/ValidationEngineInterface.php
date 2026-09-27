<?php

declare(strict_types=1);

namespace App\Extensions\InteractionEngine\System\Contracts;

use App\Extensions\InteractionEngine\System\DTO\Question;

interface ValidationEngineInterface
{
    public function validate(Question $question, mixed $value, array $context = []): array;
}
