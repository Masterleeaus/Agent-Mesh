<?php

declare(strict_types=1);

namespace App\Extensions\TitanInterfaceRuntime\System\Collection;

final class CollectionViewCatalog
{
    public const KINDS = ['cards','table','board','calendar','timeline','feed'];

    private const ORDER = ['cards'=>10,'table'=>20,'board'=>30,'calendar'=>40,'timeline'=>50,'feed'=>60];
    private const CONTAINER = ['cards'=>'panel','table'=>'table','board'=>'board','calendar'=>'calendar','timeline'=>'timeline','feed'=>'panel'];
    private const HINT = ['cards'=>'entity-card','table'=>'table','board'=>'kanban-board','calendar'=>'data-list','timeline'=>'timeline','feed'=>'data-list'];

    public static function supported(string $kind): bool { return in_array($kind,self::KINDS,true); }
    public static function order(string $kind): int { return self::ORDER[$kind] ?? 999; }
    public static function container(string $kind): string { return self::CONTAINER[$kind] ?? 'panel'; }
    public static function defaultHint(string $kind): string { return self::HINT[$kind] ?? 'stack'; }
}
