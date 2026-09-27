<?php

declare(strict_types=1);

namespace App\Extensions\TitanInterfaceRuntime\System\Presentation;

final readonly class ResolvedPresentationComponent implements \JsonSerializable
{
    /** @param list<string> $props @param list<string> $actions */
    public function __construct(
        public ?string $requestedHint,
        public string $componentId,
        public string $source,
        public string $authority,
        public bool $responsive,
        public bool $accessible,
        public bool $fallback,
        public string $reason,
        public array $props = [],
        public array $actions = [],
    ) {
        if ($authority !== 'presentation-only') throw new \InvalidArgumentException('resolved component authority must remain presentation-only.');
        if ($actions !== []) throw new \InvalidArgumentException('Builder actions may not cross the presentation adapter boundary.');
    }

    public function jsonSerialize(): array
    {
        return [
            'requested_hint' => $this->requestedHint,
            'component_id' => $this->componentId,
            'source' => $this->source,
            'authority' => $this->authority,
            'responsive' => $this->responsive,
            'accessible' => $this->accessible,
            'fallback' => $this->fallback,
            'reason' => $this->reason,
            'props' => $this->props,
            'actions' => [],
        ];
    }
}
