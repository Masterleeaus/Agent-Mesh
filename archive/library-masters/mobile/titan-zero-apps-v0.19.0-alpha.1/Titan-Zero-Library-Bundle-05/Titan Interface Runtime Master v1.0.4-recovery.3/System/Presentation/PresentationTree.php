<?php

declare(strict_types=1);

namespace App\Extensions\TitanInterfaceRuntime\System\Presentation;

final readonly class PresentationTree implements \JsonSerializable
{
    private const SURFACES = ['command', 'go', 'hub', 'onboarding'];

    /** @param array<string,mixed> $meta */
    public function __construct(
        public string $surface,
        public PresentationNode $root,
        public ResponsiveHints $responsive = new ResponsiveHints(),
        public array $meta = [],
    ) {
        if (! in_array($surface, self::SURFACES, true)) throw new \InvalidArgumentException('presentation product surface is unsupported.');
    }

    public function jsonSerialize(): array
    {
        return CanonicalPresentationValue::normalize([
            'version' => '1.0',
            'authority' => 'presentation-only',
            'surface' => $this->surface,
            'responsive' => $this->responsive->jsonSerialize(),
            'root' => $this->root->jsonSerialize(),
            'meta' => $this->meta,
        ]);
    }

    public function toCanonicalJson(): string { return CanonicalPresentationValue::json($this->jsonSerialize()); }
    public function fingerprint(): string { return hash('sha256', $this->toCanonicalJson()); }
}
