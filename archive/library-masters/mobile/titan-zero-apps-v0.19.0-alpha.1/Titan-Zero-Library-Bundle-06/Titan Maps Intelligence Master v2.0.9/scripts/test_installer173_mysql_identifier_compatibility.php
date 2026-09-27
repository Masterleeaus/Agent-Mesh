<?php

declare(strict_types=1);

$root = dirname(__DIR__);
$checks = 0; $failures = [];
$assert = static function (bool $ok, string $message) use (&$checks, &$failures): void {
    $checks++;
    if (! $ok) $failures[] = $message;
};

$target = (string) file_get_contents($root.'/database/migrations/2026_08_18_000800_create_maps_field_route_optimisation_proposals.php');
$assert(! str_contains($target, "if (Schema::hasTable('maps_field_route_optimisation_proposals')) return;"), 'proposal migration does not skip a partial table');
$assert(str_contains($target, 'ensureIndex'), 'proposal migration repairs indexes on retry');
$assert(str_contains($target, 'SHOW INDEX'), 'proposal migration detects indexes already created before a failed MySQL ALTER');

$problems = [];
foreach (glob($root.'/database/migrations/*.php') ?: [] as $file) {
    $source = (string) file_get_contents($file);
    preg_match_all("/Schema::create\\('([^']+)'\\s*,\\s*function\\s*\\(Blueprint\\s*\\$(\\w+)\\).*?\\{([\\s\\S]*?)\\n\\s*\\}\\);/", $source, $creates, PREG_SET_ORDER);
    foreach ($creates as $create) {
        [$all, $table, $var, $body] = $create;
        preg_match_all('/\\$'.preg_quote($var,'/').'->\\w+\\(\'([^\']+)\'[^;]*?\\)->(index|unique)\\(\\)/', $body, $columns, PREG_SET_ORDER);
        foreach ($columns as $column) {
            $name = $table.'_'.$column[1].'_'.$column[2];
            if (strlen($name) > 64) $problems[] = [basename($file), $name, strlen($name)];
        }
        preg_match_all('/\\$'.preg_quote($var,'/').'->(index|unique)\\(\\[([^\\]]+)\\]\\s*\\)/', $body, $compound, PREG_SET_ORDER);
        foreach ($compound as $entry) {
            preg_match_all("/'([^']+)'/", $entry[2], $cols);
            $name = $table.'_'.implode('_', $cols[1] ?? []).'_'.$entry[1];
            if (strlen($name) > 64) $problems[] = [basename($file), $name, strlen($name)];
        }
    }
}
$assert($problems === [], 'all Laravel-generated MySQL identifiers are <=64 characters: '.json_encode($problems));

if ($failures !== []) {
    foreach ($failures as $failure) fwrite(STDERR, "FAIL $failure\n");
    fwrite(STDERR, "Failed: ".count($failures)." / $checks\n");
    exit(1);
}
echo "PASS Maps Installer 1.7.3/MySQL identifier compatibility ($checks assertions)\n";
