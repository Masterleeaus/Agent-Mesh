<?php
declare(strict_types=1);

namespace App\Extensions\TitanAppsCore\System\Support;

final readonly class AppMultimodalInput
{
    /** @param list<string> $mediaRefs @param array<string,mixed> $metadata */
    public function __construct(
        public string $mode,
        public ?string $text=null,
        public array $mediaRefs=[],
        public array $metadata=[],
    ) {}

    /** @return array<string,mixed> */
    public function toArray(): array
    {
        return [
            'mode'=>$this->mode,
            'text'=>$this->text,
            'media_refs'=>$this->mediaRefs,
            'metadata'=>$this->metadata,
        ];
    }
}
