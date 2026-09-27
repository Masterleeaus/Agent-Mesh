<?php

declare(strict_types=1);

namespace App\Extensions\TitanInterfaceRuntime\System\Discovery;

final readonly class NormalizedInterfaceContribution implements \JsonSerializable
{
    /** @param array<string, mixed> $descriptor */
    public function __construct(
        public string $extensionKey,
        public string $schemaVersion,
        public string $sourceFolder,
        public string $manifestPath,
        public string $sha256,
        private array $descriptor,
    ) {
    }

    /** @return array<string, mixed> */
    public function descriptor(): array
    {
        return $this->descriptor;
    }

    /** @return array<string, mixed> */
    public function jsonSerialize(): array
    {
        return [
            'extension_key' => $this->extensionKey,
            'schema_version' => $this->schemaVersion,
            'source_folder' => $this->sourceFolder,
            'manifest_path' => $this->manifestPath,
            'sha256' => $this->sha256,
            'descriptor' => $this->descriptor,
        ];
    }
}
