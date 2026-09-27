<?php
declare(strict_types=1);
$root=dirname(__DIR__);
$fail=[]; $ok=[];
$check=function(bool $c,string $m)use(&$fail,&$ok){if($c){$ok[]=$m;}else{$fail[]=$m;} echo ($c?'PASS ':'FAIL ').$m."\n";};
$runtimePaths=['System','routes','config','extension.json','extension.manifest.json'];
$refs=[];
foreach($runtimePaths as $rel){
    $path="$root/$rel";
    if(is_file($path)){$files=[$path];}else{$files=[];$it=new RecursiveIteratorIterator(new RecursiveDirectoryIterator($path,FilesystemIterator::SKIP_DOTS));foreach($it as $f)if($f->isFile())$files[]=$f->getPathname();}
    foreach($files as $f){
        $txt=@file_get_contents($f)?:'';
        if($rel==='extension.json'){
            $installer=json_decode($txt,true);
            if(is_array($installer)){unset($installer['integrity']);$txt=json_encode($installer);}
        }
        if(preg_match('/WorkCore|workcore/',$txt))$refs[]=str_replace($root.'/','',$f);
    }
}
$check($refs===[], 'no active WorkCore references remain in runtime/config/manifest: '.implode(',',$refs));
$manifest=json_decode(file_get_contents("$root/extension.manifest.json"),true,512,JSON_THROW_ON_ERROR);
$check(($manifest['version']??null)==='10.12.0','manifest version is 10.12.0');
$package=json_decode((string)file_get_contents($root.'/package.json'),true)?:[];
$check(($package['version']??null)==='10.12.0','npm package version matches Interaction Engine release');
foreach(['interaction.capability-router','interaction.journeys','interaction.surface.hub','interaction.surface.go','interaction.surface.zero','interaction.presentation-intent'] as $cap){$check(in_array($cap,$manifest['capabilities']??[],true),"manifest advertises $cap");}
$check(($manifest['database']['shared_tables']??[])===[],'manifest has no shared CRM/business table assumptions');
$profile=file_get_contents("$root/System/Profile/FieldHomeServicesProfile.php");
$slugs=['cleaning','plumbing','electrical','hvac','handyman-property-maintenance','landscaping-gardening','pest-control','locksmith-security','roofing-guttering','appliance-equipment-repair'];
foreach($slugs as $slug)$check(str_contains($profile,"'$slug'"),"profile contains canonical vertical $slug");
$forbidden=['pressure_washing','carpet_upholstery_cleaning','window_cleaning','building_renovation'];
foreach($forbidden as $slug)$check(!str_contains($profile,"'$slug'"),"profile no longer exposes noncanonical business type $slug");
$onboardingController=(string)file_get_contents("$root/System/Http/Controllers/FieldServicesOnboardingController.php");
$check(!str_contains($onboardingController,'resources/onboarding/field-home-services-question-catalog.json'),'active onboarding API does not expose the historical WorkCore-labelled source catalogue');
$check(str_contains($onboardingController,'resources/wizards/field_home_services_onboarding.json'),'active onboarding API exposes the clean 116-question runtime wizard catalogue');
if($fail){fwrite(STDERR,"\n".count($fail)." Phase 6 architecture checks failed\n");exit(1);} echo "\n".count($ok)." Phase 6 architecture checks passed\n";
