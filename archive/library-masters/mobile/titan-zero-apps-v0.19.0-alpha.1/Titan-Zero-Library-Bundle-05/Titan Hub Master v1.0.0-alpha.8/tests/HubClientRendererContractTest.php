<?php
$root=dirname(__DIR__);
$js=file_get_contents($root.'/resources/js/hub.js');
function hcr(bool $ok,string $message):void{if(!$ok){fwrite(STDERR,"FAIL: {$message}\n");exit(1);}echo "PASS: {$message}\n";}
hcr(!str_contains($js,'JSON.stringify(projection,null,2)'),'raw JSON pre renderer removed');
hcr(!preg_match('/\.innerHTML\s*=.*(?:data|projection|JSON\.stringify)/s',$js),'runtime data is not interpolated with innerHTML');
hcr(str_contains($js,'textContent'),'safe DOM text rendering used');
foreach(['mobile-app-shell','summary-banner','data-list','entity-card','empty-state','chat-thread','key-value-list'] as $component) hcr(str_contains($js,$component),'client recognizes '.$component);
hcr(str_contains($js,"window.addEventListener('offline'"),'offline event handled');
hcr(str_contains($js,"window.addEventListener('online'"),'online event handled');
hcr(!preg_match('/\beval\s*\(|new\s+Function\s*\(/',$js),'no arbitrary JS execution');
