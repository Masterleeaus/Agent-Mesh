<?php

declare(strict_types=1);

namespace App\Extensions\TitanInterfaceRuntime\System\Command;

final readonly class CommandItem implements \JsonSerializable
{
    private const KINDS=['ask','navigate','inspect','workspace','action'];

    /** @param array<string,mixed> $intent */
    public function __construct(
        public string $key,
        public string $kind,
        public string $label,
        public string $description,
        public array $intent,
        public int $score,
        public bool $executable=false,
    ) {
        if (! in_array($kind,self::KINDS,true)) throw new \InvalidArgumentException('command item kind is invalid.');
        if ($key==='' || trim($label)==='') throw new \InvalidArgumentException('command item key and label are required.');
        if ($score<0 || $score>10000) throw new \InvalidArgumentException('command item score is invalid.');
        if ($executable) throw new \InvalidArgumentException('command surface items are intents and may not execute locally.');
    }

    public function jsonSerialize(): array
    {
        return ['key'=>$this->key,'kind'=>$this->kind,'label'=>$this->label,'description'=>$this->description,'intent'=>$this->intent,'score'=>$this->score,'executable'=>false];
    }
}
