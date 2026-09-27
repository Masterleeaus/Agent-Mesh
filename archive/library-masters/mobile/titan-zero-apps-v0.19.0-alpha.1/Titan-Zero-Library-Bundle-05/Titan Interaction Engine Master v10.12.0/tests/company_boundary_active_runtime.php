<?php
$root=dirname(__DIR__);
$active=['System','config','routes','resources'];
$fail=[];
foreach($active as $dir){
 $path=$root.'/'.$dir; if(!is_dir($path)) continue;
 $it=new RecursiveIteratorIterator(new RecursiveDirectoryIterator($path,FilesystemIterator::SKIP_DOTS));
 foreach($it as $f){
  if(!$f->isFile()) continue;
  $rel=str_replace('\\','/',substr($f->getPathname(),strlen($root)+1));
  $s=(string)file_get_contents($f->getPathname());
  if(str_contains($s,'tenant_id')||str_contains($s,'tenantId')) $fail[]=$rel;
 }
}
if($fail){fwrite(STDERR,'Active runtime contains legacy tenant boundary: '.implode(', ',$fail)."\n");exit(1);}
echo "INTERACTION_ACTIVE_COMPANY_BOUNDARY: PASS\n";
