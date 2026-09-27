<?php

declare(strict_types=1);

$source = file_get_contents(__DIR__.'/../Services/NearestResourceService.php');
$errors=[];
foreach ([
    'workerLocationStaleAfterSeconds' => 'worker stale cutoff',
    "permanently_closed" => 'permanently closed discovery filter',
    "temporarily_closed" => 'temporarily closed discovery filter',
    "where(function" => 'business-hours nullable filter',
    "currently_open" => 'business-hours field',
] as $needle=>$label) if (!str_contains($source,$needle)) $errors[]="$label missing";
if ($errors){fwrite(STDERR,"FAIL\n - ".implode("\n - ",$errors)."\n");exit(1);} echo "PASS nearest resource quality architecture\n";
