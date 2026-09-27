<?php

declare(strict_types=1);

namespace App\Extensions\TitanInterfaceRuntime\System\Presentation;

use JsonSerializable;

final readonly class PresentationNode implements JsonSerializable
{
    /**
     * @param array<string, mixed> $props
     * @param list<PresentationNode> $children
     */
    public function __construct(
        public string $type,
        public string $key,
        public array $props = [],
        public array $children = [],
    ) {
        if ($this->type === '' || $this->key === '') {
            throw new \InvalidArgumentException('Presentation node type and key are required.');
        }

        foreach ($this->children as $child) {
            if (! $child instanceof self) {
                throw new \InvalidArgumentException('Presentation children must be PresentationNode instances.');
            }
        }
    }

    /** @return array<string, mixed> */
    public function jsonSerialize(): array
    {
        return [
            'type' => $this->type,
            'key' => $this->key,
            'props' => CanonicalPresentationValue::normalize($this->props),
            'children' => array_map(
                static fn (self $child): array => $child->jsonSerialize(),
                $this->children,
            ),
        ];
    }
}
