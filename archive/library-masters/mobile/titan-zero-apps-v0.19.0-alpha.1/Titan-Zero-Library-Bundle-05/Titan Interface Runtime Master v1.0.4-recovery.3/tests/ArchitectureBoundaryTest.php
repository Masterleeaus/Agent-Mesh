<?php
$root=dirname(__DIR__);
$bad=[];
$hostCompatibilityAllowlist=[
    'TitanMySqlMigrationCompatibility.php'=>true, // static installer guidance only
    'TitanHostMenuCompatibilityAdapter.php'=>true, // writes only extension-owned host menu projection rows
];
foreach(new RecursiveIteratorIterator(new RecursiveDirectoryIterator($root.'/System')) as $f){
    if(!$f->isFile()||$f->getExtension()!=='php') continue;
    if(isset($hostCompatibilityAllowlist[$f->getFilename()])) continue;
    $s=file_get_contents($f->getPathname());
    if(preg_match('/DB::|\$table|->insert\(|->update\(|->delete\(/',$s)) $bad[]=$f->getFilename();
}
if($bad){fwrite(STDERR,'FAIL direct business DB authority: '.implode(',',$bad));exit(1);}
echo "PASS: no direct business database authority\n";
