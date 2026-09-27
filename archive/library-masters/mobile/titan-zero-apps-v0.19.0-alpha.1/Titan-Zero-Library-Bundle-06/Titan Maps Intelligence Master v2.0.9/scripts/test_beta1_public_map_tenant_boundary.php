<?php

declare(strict_types=1);
$errors=[];
$provider=file_get_contents(__DIR__.'/../System/TitanMapsIntelligenceServiceProvider.php');
foreach([
    "['web', 'auth', 'titan.maps.reject-company-override', 'titan.maps.company', 'titan.maps.bind-company-models']"=>'user route tenant/auth group',
    "['api', 'auth:sanctum', 'titan.maps.reject-company-override', 'titan.maps.company', 'titan.maps.bind-company-models']"=>'api route tenant/auth group',
] as $needle=>$label) if(!str_contains($provider,$needle))$errors[]="$label missing";
$user=file_get_contents(__DIR__.'/../routes/user.php');$api=file_get_contents(__DIR__.'/../routes/api.php');
if(str_contains($user,'withoutMiddleware')||str_contains($api,'withoutMiddleware'))$errors[]='route-level middleware bypass detected';
$mapData=file_get_contents(__DIR__.'/../Services/MapViewDataService.php');
if(str_contains($mapData,"'company_id'=>")||str_contains($mapData,"'company_id' =>"))$errors[]='map payload explicitly exposes company_id';
if($errors){fwrite(STDERR,"FAIL\n - ".implode("\n - ",$errors)."\n");exit(1);} echo "PASS public map tenant boundary (no unauthenticated public map surface)\n";
