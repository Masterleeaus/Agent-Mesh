<?php
return [
    'surfaces' => ['zero','go','hub'],
    'limits' => ['max_contributions' => 1000, 'max_metadata_bytes' => 32768],
    'fallback' => ['strategy' => 'semantic-static', 'allow_webgl' => true, 'allow_canvas' => true, 'allow_video' => true],
    'security' => ['forbidden_keys' => ['script','javascript','html','css','eval','sql','credentials','token','secret','rawUrl','raw_url']],
];
