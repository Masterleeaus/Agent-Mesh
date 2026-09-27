<?php

declare(strict_types=1);

namespace App\Extensions\InteractionEngine\System\DTO;

final readonly class Section
{
    public function __construct(
        public string $id,
        public string $title,
        /** @var Question[] */
        public array $questions,
        public array $metadata = [],
    ) {}
}
