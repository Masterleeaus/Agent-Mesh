<?php
declare(strict_types=1);
$root=dirname(__DIR__);
$manifest=$root.'/resources/interface/interface-manifest.json';
if(!is_file($manifest)){fwrite(STDERR,"missing interface contribution\n");exit(1);}
$j=json_decode((string)file_get_contents($manifest),true);
if(!is_array($j)){fwrite(STDERR,"invalid contribution JSON\n");exit(1);}
$raw=(string)file_get_contents($manifest);
foreach(['"command"','"bos"','"onboarding"'] as $legacy){if($legacy==='"onboarding"' && 'titan-trust'==='onboarding-pro')continue;if(str_contains($raw,$legacy)){fwrite(STDERR,"legacy canonical surface in contribution: $legacy\n");exit(1);}}
if(preg_match('/<script|javascript:|executable_ui"\s*:\s*true/i',$raw)){fwrite(STDERR,"executable UI prohibited\n");exit(1);}
$php='';$it=new RecursiveIteratorIterator(new RecursiveDirectoryIterator($root.'/System',FilesystemIterator::SKIP_DOTS));foreach($it as $f){if($f->isFile()&&$f->getExtension()==='php')$php.=file_get_contents($f->getPathname())."\n";}
if(str_contains($php,'App\\Extensions\\InterfaceRuntime\\System\\')){fwrite(STDERR,"private Interface Runtime import found\n");exit(1);}
if('titan-trust'==='onboarding-pro' && str_contains($php,'UniversalWizardEngine')){fwrite(STDERR,"private Interaction Engine implementation import found\n");exit(1);}
echo "PASS: Agent 3 Titan Apps convergence titan-trust\n";
