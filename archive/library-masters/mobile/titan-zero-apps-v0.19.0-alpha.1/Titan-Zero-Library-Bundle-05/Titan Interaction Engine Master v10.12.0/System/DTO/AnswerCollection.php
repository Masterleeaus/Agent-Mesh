<?php

declare(strict_types=1);

namespace App\Extensions\InteractionEngine\System\DTO;

use Illuminate\Support\Collection;

class AnswerCollection
{
    private Collection $answers;

    public function __construct(Answer ...$answers)
    {
        $this->answers = collect($answers);
    }

    public function get(string $key): ?Answer
    {
        return $this->answers->first(fn($a) => $a->questionKey === $key);
    }

    public function getValue(string $key): mixed
    {
        return $this->get($key)?->value;
    }

    public function all(): array
    {
        return $this->answers->all();
    }

    public function toArray(): array
    {
        return $this->answers->mapWithKeys(fn($a) => [$a->questionKey => $a->value])->all();
    }
}
