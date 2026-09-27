<?php

declare(strict_types=1);

namespace App\Extensions\TitanInterfaceRuntime\System\Registry;

final readonly class DomainRegistrySnapshot implements \JsonSerializable
{
    /**
     * @param array<string,DomainDescriptor> $domains
     * @param array<string,list<string>> $collisions
     * @param array<string,list<string>> $rejected
     */
    public function __construct(
        public array $domains = [],
        public array $collisions = [],
        public array $rejected = [],
    ) {
    }

    /** @return array<string,mixed> */
    public function jsonSerialize(): array
    {
        return [
            'summary' => [
                'active_domains' => count($this->domains),
                'collisions' => count($this->collisions),
                'rejected_contributors' => count($this->rejected),
            ],
            'domains' => array_map(static fn (DomainDescriptor $domain): array => $domain->jsonSerialize(), $this->domains),
            'collisions' => $this->collisions,
            'rejected' => $this->rejected,
        ];
    }
}
