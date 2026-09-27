<?php

declare(strict_types=1);

namespace App\Extensions\TitanInterfaceRuntime\System\Workspace;

use App\Extensions\TitanInterfaceRuntime\System\Registry\FacetDescriptor;

final readonly class FacetSlot implements \JsonSerializable
{
    public function __construct(
        public FacetDescriptor $facet,
        public string $loading = 'lazy',
        public mixed $payload = null,
    ) {
        if ($loading !== 'lazy') throw new \InvalidArgumentException('Pass 6 facet slots must be lazy.');
        if ($payload !== null) throw new \InvalidArgumentException('Pass 6 does not load authoritative facet payloads.');
    }

    public function jsonSerialize(): array
    {
        return [
            'facet' => $this->facet->jsonSerialize(),
            'loading' => $this->loading,
            'payload' => null,
        ];
    }
}
