<?php

declare(strict_types=1);

namespace App\Extensions\InteractionEngine\System\DTO;

final readonly class Question
{
    public function __construct(
        public string $key,
        public string $question,
        public string $responseType,
        public array $options = [],
        public ?string $optionsSource = null,
        public array $validation = [],
        public mixed $default = null,
        public bool $optional = false,
        public string $handling = 'ask',
        public string $priority = 'P1',
        public ?string $condition = null,
        public array $metadata = [],
    ) {}
}
