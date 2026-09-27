<?php

declare(strict_types=1);

namespace App\Extensions\TitanInterfaceRuntime\System\Authority;

use JsonSerializable;

final readonly class AuthorityReadResult implements JsonSerializable
{
    /**
     * @param array<string, mixed>|list<mixed> $data
     * @param array<string, mixed> $provenance
     */
    public function __construct(
        public string $authority,
        public string $reference,
        public array $data,
        public array $provenance,
    ) {
        if ($this->authority === '' || $this->reference === '') {
            throw new \InvalidArgumentException('Authority and reference are required.');
        }
    }

    /** @param array<string, mixed> $provenance */
    public function withProvenance(array $provenance): self
    {
        return new self($this->authority, $this->reference, $this->data, $provenance);
    }

    /** @return array<string, mixed> */
    public function jsonSerialize(): array
    {
        return [
            'authority' => $this->authority,
            'reference' => $this->reference,
            'data' => $this->data,
            'provenance' => $this->provenance,
        ];
    }
}
