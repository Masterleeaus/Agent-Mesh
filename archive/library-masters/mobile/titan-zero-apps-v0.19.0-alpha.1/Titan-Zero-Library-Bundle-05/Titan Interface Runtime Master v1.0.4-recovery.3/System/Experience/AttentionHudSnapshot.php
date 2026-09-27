<?php

declare(strict_types=1);

namespace App\Extensions\TitanInterfaceRuntime\System\Experience;

final readonly class AttentionHudSnapshot implements \JsonSerializable
{
    /** @param list<array<string,mixed>> $items @param array<string,string> $trayStatus */
    public function __construct(public array $items, public array $trayStatus, public bool $truncated=false) {}
    /** @return array<string,mixed> */
    public function jsonSerialize(): array { return ['items'=>$this->items,'tray_status'=>$this->trayStatus,'truncated'=>$this->truncated,'item_count'=>count($this->items),'presentation_only'=>true]; }
}
