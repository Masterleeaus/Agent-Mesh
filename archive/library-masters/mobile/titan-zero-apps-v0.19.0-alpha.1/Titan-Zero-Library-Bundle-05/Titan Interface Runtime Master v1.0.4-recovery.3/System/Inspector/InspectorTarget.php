<?php

declare(strict_types=1);

namespace App\Extensions\TitanInterfaceRuntime\System\Inspector;

final readonly class InspectorTarget implements \JsonSerializable
{
    public function __construct(
        public string $kind,
        public string $objectRef,
        public string $domain,
        public bool $executable = false,
    ) {
        if (! in_array($kind,['inspect','workspace'],true)) throw new \InvalidArgumentException('Inspector target kind is invalid.');
        if ($objectRef==='' || $domain==='') throw new \InvalidArgumentException('Inspector target requires object and domain references.');
        if ($executable) throw new \InvalidArgumentException('Inspector targets are navigation intents, not executable actions.');
    }

    public function jsonSerialize(): array
    {
        return ['kind'=>$this->kind,'object_ref'=>$this->objectRef,'domain'=>$this->domain,'executable'=>false];
    }
}
