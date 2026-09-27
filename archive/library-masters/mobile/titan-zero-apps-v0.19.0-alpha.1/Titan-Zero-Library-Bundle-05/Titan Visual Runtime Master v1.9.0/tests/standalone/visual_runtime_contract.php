<?php
declare(strict_types=1);
$base=dirname(__DIR__,2); foreach(['extension.json','System/Contracts/VisualRuntime.php','System/Runtime/AdaptiveVisualRuntime.php','resources/js/titan-visual-runtime.js'] as $f){if(!is_file($base.'/'.$f)){fwrite(STDERR,"missing $f\n");exit(1);}}
$m=json_decode(file_get_contents($base.'/extension.json'),true,512,JSON_THROW_ON_ERROR); if(($m['slug']??'')!=='titan-visual-runtime') exit(2); if(($m['compatibility']['arbitrary_executable_code']??true)!==false) exit(3); echo "VISUAL_RUNTIME_CONTRACT: PASS\n";
