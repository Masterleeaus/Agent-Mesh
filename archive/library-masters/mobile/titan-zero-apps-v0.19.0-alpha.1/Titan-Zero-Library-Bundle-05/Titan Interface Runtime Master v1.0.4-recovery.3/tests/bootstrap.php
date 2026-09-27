<?php
spl_autoload_register(function(string $class):void{ $prefix='App\\Extensions\\TitanInterfaceRuntime\\'; if(!str_starts_with($class,$prefix))return; $rel=str_replace('\\','/',substr($class,strlen($prefix))); $file=dirname(__DIR__).'/'.$rel.'.php'; if(is_file($file)) require $file; });
function ok(bool $v,string $m):void{ if(!$v){fwrite(STDERR,"FAIL: $m\n");exit(1);} echo "PASS: $m\n"; }
