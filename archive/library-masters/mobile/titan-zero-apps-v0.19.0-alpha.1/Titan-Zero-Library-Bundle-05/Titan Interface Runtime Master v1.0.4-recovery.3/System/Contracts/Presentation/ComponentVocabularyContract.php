<?php

declare(strict_types=1);

namespace App\Extensions\TitanInterfaceRuntime\System\Contracts\Presentation;

interface ComponentVocabularyContract
{
    /** @return array<string,mixed>|null */
    public function find(string $id): ?array;

    /** @return list<string> */
    public function ids(): array;

    public function source(): string;
}
