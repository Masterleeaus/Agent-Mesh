<?php

declare(strict_types=1);

namespace App\Extensions\TitanInterfaceRuntime\System\Presentation;

use App\Extensions\TitanInterfaceRuntime\System\Contracts\Presentation\ComponentVocabularyContract;

final readonly class ArrayComponentVocabulary implements ComponentVocabularyContract
{
    /** @param array<string,array<string,mixed>> $components */
    public function __construct(private array $components, private string $vocabularySource = 'array-test-vocabulary') {}

    public function find(string $id): ?array { return $this->components[$id] ?? null; }
    public function ids(): array { $ids = array_keys($this->components); sort($ids, SORT_STRING); return array_values($ids); }
    public function source(): string { return $this->vocabularySource; }
}
