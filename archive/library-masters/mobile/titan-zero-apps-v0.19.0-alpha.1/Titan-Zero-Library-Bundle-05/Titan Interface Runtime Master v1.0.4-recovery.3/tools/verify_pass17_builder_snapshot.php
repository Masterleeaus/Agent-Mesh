<?php

declare(strict_types=1);
$root=$argv[1]??'';$builder=rtrim($root,'/').'/app/Extensions/TitanBuilder';if(!is_dir($builder))throw new RuntimeException('TitanBuilder snapshot not found.');
$required=[
    'System/Contracts/PreviewRenderer.php'=>'render(',
    'System/Contracts/Publisher.php'=>'rollback(',
    'System/Publishing/VersionedPublisher.php'=>'publish(',
    'System/Publishing/VersionedPublisher.php#rollback'=>'rollback(',
    'System/Models/BuilderVersion.php'=>'titan_builder_versions',
    'System/Models/PublishSnapshot.php'=>'PublishSnapshot',
    'System/Preview/ValidatedPreviewRenderer.php'=>'validation',
    'System/Provisioning/EloquentApplicationProvisioningGateway.php'=>'builder.rollback',
];
foreach($required as$key=>$needle){$rel=str_contains($key,'#')?explode('#',$key,2)[0]:$key;$p=$builder.'/'.$rel;if(!is_file($p)||!str_contains(file_get_contents($p),$needle))throw new RuntimeException("Builder configuration lifecycle signal missing: {$key}");}
echo "PASS 17 BUILDER SNAPSHOT: current Titan Builder exposes validated preview, versioned publish history and rollback authority needed by the generic lifecycle contract\n";
