<?php

declare(strict_types=1);
namespace App\Extensions\TitanInterfaceRuntime\System\Host;
final class TitanMySqlMigrationCompatibility
{
    /** @return list<string> */
    public static function unsafePrecisionTimestamps(string $php): array { preg_match_all('/->timestamp\(\s*[\'\"]([^\'\"]+)[\'\"]\s*,\s*[1-6]\s*\)/',$php,$m); return $m[1]??[]; }
    public static function guidance(): string { return 'For certified MySQL strict-mode microsecond fields prefer $table->dateTime(name, 6).'; }
}
