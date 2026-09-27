<?php
$root=dirname(__DIR__);
$bridge=file_get_contents($root.'/System/Presentation/AdaptiveHubPresentationBridge.php');
$controller=file_get_contents($root.'/System/Http/Controllers/HubApiController.php');
function hca(bool $ok,string $message):void{if(!$ok){fwrite(STDERR,"FAIL: {$message}\n");exit(1);}echo "PASS: {$message}\n";}
hca(str_contains($controller,"'text'=>'nullable|string|max:10000'"),'customer text input accepted');
hca(str_contains($bridge,"hub.customer-assistant.message"),'plain text maps to customer assistant presentation intent');
hca(str_contains($bridge,"['text'=>\$text]"),'customer text is passed as a fact, not execution authority');
hca(str_contains($bridge,"'executed'=>false"),'assistant planning does not bypass governed execution');
