<?php

declare(strict_types=1);

namespace App\Extensions\TitanInterfaceRuntime\System\Registry;

final readonly class GlobalWorkRegistrySnapshot implements \JsonSerializable
{
    /**
     * @param array<string,GlobalWorkDescriptor> $declarations
     * @param array<string,list<string>> $byTray
     * @param array<string,list<string>> $rejected
     */
    public function __construct(
        public array $declarations = [],
        public array $byTray = [],
        public array $rejected = [],
    ) {
    }

    /** @return array<string,mixed> */
    public function jsonSerialize(): array
    {
        return [
            'declarations' => array_map(static fn (GlobalWorkDescriptor $d): array => $d->jsonSerialize(), $this->declarations),
            'by_tray' => $this->byTray,
            'rejected' => $this->rejected,
            'declaration_count' => count($this->declarations),
        ];
    }
}
