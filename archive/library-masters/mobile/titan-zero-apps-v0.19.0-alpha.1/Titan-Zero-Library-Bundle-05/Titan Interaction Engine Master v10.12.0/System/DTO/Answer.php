<?php

declare(strict_types=1);

namespace App\Extensions\InteractionEngine\System\DTO;

final readonly class Answer
{
    public function __construct(
        public string $questionKey,
        public mixed $value,
        public string $source,
        public ?float $confidence = null,
        public ?\DateTimeImmutable $timestamp = null,
        public bool $editedByUser = false,
        public bool $editedByAI = false,
        public ?string $validationState = null,
    ) {}
}
