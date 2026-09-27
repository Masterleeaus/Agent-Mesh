<?php

declare(strict_types=1);

$root = dirname(__DIR__);
spl_autoload_register(static function (string $class) use ($root): void {
    $prefix='App\\Extensions\\TitanInterfaceRuntime\\'; if(!str_starts_with($class,$prefix))return;
    $path=$root.'/'.str_replace('\\','/',substr($class,strlen($prefix))).'.php'; if(is_file($path))require_once $path;
});

use App\Extensions\TitanInterfaceRuntime\System\Configuration\ConfigurationPayloadNormalizer;

function expect17(bool $ok,string $message):void{if(!$ok)throw new RuntimeException($message);}

$normalizer=new ConfigurationPayloadNormalizer();
$data=$normalizer->normalize([
    'status'=>'published',
    'current_version'=>['id'=>'v8','label'=>'Current','state'=>'published','created_at'=>'2026-08-18T10:00:00Z','raw_config'=>'secret'],
    'published_version'=>['id'=>'v8','label'=>'Current','state'=>'published','published_at'=>'2026-08-18T10:05:00Z'],
    'preview'=>['available'=>true,'source_ref'=>'preview:v8','html'=>'secret'],
    'validation'=>['status'=>'valid','errors'=>[],'warnings'=>[]],
    'history'=>[['id'=>'v8','label'=>'Current','state'=>'published','summary'=>'Published','published'=>true,'blob'=>'secret']],
    'rollback'=>['available'=>false],
    'action_refs'=>['preview'=>'builder.preview','validate'=>'builder.validate','publish'=>'builder.publish','rollback'=>'builder.rollback'],
    'configuration'=>['api_key'=>'secret'],
]);
expect17($data['status']==='published','status missing');
expect17(($data['current_version']['id']??null)==='v8','version metadata missing');
expect17(!array_key_exists('raw_config',$data['current_version']),'raw configuration leaked through version metadata');
expect17(!array_key_exists('html',$data['preview']),'preview body must not cross the boundary');
expect17(!array_key_exists('blob',$data['history'][0]),'history payload must remain metadata-only');
expect17(!str_contains(json_encode($data,JSON_THROW_ON_ERROR),'api_key'),'authoritative configuration payload leaked');
expect17(($data['action_refs']['publish']??null)==='builder.publish','governed action reference missing');

echo "PASS 17 VERIFY: configuration lifecycle projection is metadata-only and preserves source-owned version/action authority\n";
