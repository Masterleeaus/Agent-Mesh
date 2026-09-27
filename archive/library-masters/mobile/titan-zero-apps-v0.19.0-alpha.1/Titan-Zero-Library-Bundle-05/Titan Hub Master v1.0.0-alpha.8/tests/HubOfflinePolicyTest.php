<?php
$root=dirname(__DIR__);
$sw=file_get_contents($root.'/System/Http/Controllers/HubPwaController.php');
$shell=file_get_contents($root.'/resources/views/shell.blade.php');
function hop(bool $ok,string $message):void{if(!$ok){fwrite(STDERR,"FAIL: {$message}\n");exit(1);}echo "PASS: {$message}\n";}
hop(str_contains($sw,"assets/hub.js"),'Hub static JS is eligible for shell cache');
hop(str_contains($sw,"u.pathname.includes('/api/')"),'API remains network-only');
hop(str_contains($sw,"e.request.mode==='navigate'"),'authenticated navigation remains network-only');
hop(str_contains($sw,'caches.keys()'),'old Hub caches are purged');
hop(str_contains($sw,'titan-hub-static-'),'versioned static-only cache used');
hop(!str_contains($sw,"c.put(e.request,copy)"),'arbitrary GET responses are not cached');
hop(str_contains($shell,'hub-connectivity'),'shell exposes connectivity status');
