<?php

declare(strict_types=1);

namespace App\Extensions\TitanInterfaceRuntime\System\Surfaces;

final class GlobalWorkTrayCatalog
{
    public const ORDER = ['continue', 'attention', 'approvals', 'inbox', 'sync'];

    public static function accepts(string $tray): bool
    {
        return in_array($tray, self::ORDER, true);
    }

    public static function rank(string $tray): int
    {
        $rank = array_search($tray, self::ORDER, true);
        if ($rank === false) throw new \InvalidArgumentException("Unsupported global work tray '{$tray}'.");
        return $rank;
    }
}
