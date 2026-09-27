<?php

declare(strict_types=1);
$source=file_get_contents(__DIR__.'/../Services/DispatchIntelligenceService.php');
$errors=[];
foreach(['RouteFreshnessPolicy','staleTooOld','stale_too_old_after_refresh_failure','mustRefresh'] as $needle) if(!str_contains($source,$needle))$errors[]=$needle.' missing';
if($errors){fwrite(STDERR,"FAIL\n - ".implode("\n - ",$errors)."\n");exit(1);} echo "PASS dispatch stale route architecture\n";
