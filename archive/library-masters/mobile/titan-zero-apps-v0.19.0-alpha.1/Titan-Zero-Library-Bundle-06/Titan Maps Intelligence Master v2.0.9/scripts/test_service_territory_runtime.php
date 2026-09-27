<?php

declare(strict_types=1);

$root = dirname(__DIR__);
foreach (['DTO/TerritoryMatchResult.php','Services/ServiceTerritoryMatcher.php'] as $file) {
    if (!is_file($root.'/'.$file)) { fwrite(STDERR, "Missing {$file}\n"); exit(1); }
    require_once $root.'/'.$file;
}

use App\Extensions\TitanMapsIntelligence\Services\ServiceTerritoryMatcher;

$m = new ServiceTerritoryMatcher();
$circle = ['id'=>'c1','effect'=>'include','match_mode'=>'circle','priority'=>10,'center_latitude'=>-37.81,'center_longitude'=>144.96,'radius_metres'=>5000];
if (!$m->matches($circle, ['latitude'=>-37.82,'longitude'=>144.97])->matched) { fwrite(STDERR,"circle should match\n"); exit(1); }
if ($m->matches($circle, ['latitude'=>-38.1,'longitude'=>145.3])->matched) { fwrite(STDERR,"far circle should not match\n"); exit(1); }
$polygon=['id'=>'p1','effect'=>'include','match_mode'=>'polygon','priority'=>10,'geometry'=>[['lat'=>-37.9,'lng'=>144.9],['lat'=>-37.7,'lng'=>144.9],['lat'=>-37.7,'lng'=>145.1],['lat'=>-37.9,'lng'=>145.1]]];
if (!$m->matches($polygon,['latitude'=>-37.8,'longitude'=>145.0])->matched) { fwrite(STDERR,"polygon should match\n"); exit(1); }
$postcode=['id'=>'pc','effect'=>'include','match_mode'=>'postcode','priority'=>5,'locality_values'=>['3071',' 3072 ']];
if (!$m->matches($postcode,['postcode'=>'3072'])->matched) { fwrite(STDERR,"postcode should normalize/match\n"); exit(1); }
$suburb=['id'=>'s','effect'=>'include','match_mode'=>'suburb','priority'=>5,'locality_values'=>['Northcote','Thornbury']];
if (!$m->matches($suburb,['suburb'=>' thornbury '])->matched) { fwrite(STDERR,"suburb should normalize/match\n"); exit(1); }
$resolution=$m->resolve([
 ['id'=>'include','effect'=>'include','match_mode'=>'postcode','priority'=>100,'locality_values'=>['3071']],
 ['id'=>'exclude','effect'=>'exclude','match_mode'=>'postcode','priority'=>1,'locality_values'=>['3071']],
], ['postcode'=>'3071']);
if (($resolution['covered'] ?? true) !== false || ($resolution['blocked_by'] ?? null) !== 'exclude') { fwrite(STDERR,"exclusion must block coverage regardless of include priority\n"); exit(1); }
echo "Service territory runtime: PASS\n";
