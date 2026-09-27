<?php

declare(strict_types=1);

namespace App\Extensions\TitanInterfaceRuntime\System\Discovery;

final readonly class ContributionHealth implements \JsonSerializable
{
    /** @param list<string> $errors */
    public function __construct(
        public string $source,
        public ?string $extensionKey,
        public string $status,
        public array $errors = [],
        public ?string $manifestPath = null,
    ) {
    }

    /** @return array<string, mixed> */
    public function jsonSerialize(): array
    {
        return [
            'source' => $this->source,
            'extension_key' => $this->extensionKey,
            'status' => $this->status,
            'errors' => $this->errors,
            'manifest_path' => $this->manifestPath,
        ];
    }
}
