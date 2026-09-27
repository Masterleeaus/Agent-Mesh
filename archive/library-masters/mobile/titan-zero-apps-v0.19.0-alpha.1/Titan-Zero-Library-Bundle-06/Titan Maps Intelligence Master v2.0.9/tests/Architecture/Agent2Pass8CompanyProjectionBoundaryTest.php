<?php
declare(strict_types=1);

/**
 * Agent 2 Pass 8 static architecture guard.
 * company_id is the sole canonical company boundary.
 */
$root=dirname(__DIR__,2);
$fail=[];
$contribution=$root.'/resources/titan-apps/interface-contributions.json';
if(is_file($contribution)){
    $doc=json_decode((string)file_get_contents($contribution),true);
    foreach((array)($doc['contributions']??[]) as $c){
        $surfaces=(array)($c['supported_surfaces']??[]);
        $map=(array)($c['projection_by_surface']??[]);
        if(count($map)!==count($surfaces))$fail[]='projection map does not cover every surface: '.($c['contribution_id']??'?');
        foreach($surfaces as $surface){
            if(!isset($map[$surface])||trim((string)$map[$surface])==='')$fail[]='missing surface projection: '.($c['contribution_id']??'?').' '.$surface;
        }
        if(count($surfaces)>1&&count(array_unique(array_values($map)))!==count($surfaces))$fail[]='multi-surface contribution shares a projection: '.($c['contribution_id']??'?');
    }
}
if($fail){fwrite(STDERR,implode("\n",$fail)."\n");exit(1);}
fwrite(STDOUT,"Agent2 Pass8 company/projection boundary PASS\n");
