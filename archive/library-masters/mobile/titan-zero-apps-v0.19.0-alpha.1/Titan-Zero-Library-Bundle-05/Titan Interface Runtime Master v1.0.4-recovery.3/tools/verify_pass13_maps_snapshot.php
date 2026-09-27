<?php

declare(strict_types=1);

$root=$argv[1] ?? null;
if (! is_string($root) || ! is_dir($root)) { fwrite(STDERR,"usage: php verify_pass13_maps_snapshot.php /path/to/TitanMapsIntelligence\n"); exit(2); }
$cap=(string)file_get_contents($root.'/Services/MapsCapabilityService.php');
foreach([
    'titan-maps-intelligence.search.read',
    'titan-maps-intelligence.candidates.list',
    'titan-maps-intelligence.candidate.promote',
    'titan-maps-intelligence.territory.analyse',
] as $id) if (! str_contains($cap,$id)) { fwrite(STDERR,"FAIL Maps capability missing {$id}\n"); exit(1); }
foreach([
    'Services/RoutingService.php',
    'Contracts/RoutingProvider.php',
    'Contracts/TrafficProvider.php',
    'Providers/TrafficProviderRegistry.php',
    'Models/MapLocation.php',
    'Models/DiscoveryCandidate.php',
    'Models/TerritoryAnalysis.php',
] as $relative) if (! is_file($root.'/'.$relative)) { fwrite(STDERR,"FAIL Maps spatial primitive missing {$relative}\n"); exit(1); }
$hasInterfaceContribution=false;
$sidecar=$root.'/extension.manifest.json';
if(is_file($sidecar)){ $decoded=json_decode((string)file_get_contents($sidecar),true); $hasInterfaceContribution=is_array($decoded)&&is_array($decoded['interface_contribution']??null)&&(($decoded['interface_contribution']['enabled']??false)===true); }
if(is_file($root.'/resources/interface/interface-manifest.json')) $hasInterfaceContribution=true;
echo 'PASS13_MAPS_SNAPSHOT_OK capabilities=4 spatial_primitives=7 interface_contribution=' . ($hasInterfaceContribution?'present':'not-yet-declared') . "\n";
