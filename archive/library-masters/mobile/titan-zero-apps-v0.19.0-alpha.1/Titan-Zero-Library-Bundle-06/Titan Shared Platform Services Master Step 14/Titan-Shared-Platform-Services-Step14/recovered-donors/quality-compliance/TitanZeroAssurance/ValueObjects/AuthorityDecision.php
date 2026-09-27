<?php

declare(strict_types=1);

namespace Modules\TitanZeroAssurance\ValueObjects;

final readonly class AuthorityDecision
{
    /** @param list<string> $reasons */
    public function __construct(
        public string $status,
        public array $reasons = [],
    ) {
    }

    public function mayExecute(): bool
    {
        return $this->status === 'allowed';
    }

    /** @return array{status:string,reasons:list<string>} */
    public function toArray(): array
    {
        return ['status' => $this->status, 'reasons' => $this->reasons];
    }
}
