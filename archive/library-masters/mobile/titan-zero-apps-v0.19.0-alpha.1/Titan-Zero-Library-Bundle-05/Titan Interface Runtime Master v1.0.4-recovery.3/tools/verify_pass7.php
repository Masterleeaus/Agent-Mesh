<?php

declare(strict_types=1);

$root = dirname(__DIR__);
spl_autoload_register(static function (string $class) use ($root): void {
    $prefix = 'App\\Extensions\\TitanInterfaceRuntime\\';
    if (!str_starts_with($class, $prefix)) return;
    $relative = str_replace('\\', '/', substr($class, strlen($prefix)));
    $path = $root . '/' . $relative . '.php';
    if (is_file($path)) require_once $path;
});

use App\Extensions\TitanInterfaceRuntime\System\Presentation\ArrayComponentVocabulary;
use App\Extensions\TitanInterfaceRuntime\System\Presentation\BuilderPresentationAdapter;
use App\Extensions\TitanInterfaceRuntime\System\Presentation\PresentationComponentPolicy;
use App\Extensions\TitanInterfaceRuntime\System\Presentation\PresentationNode;
use App\Extensions\TitanInterfaceRuntime\System\Presentation\PresentationTree;
use App\Extensions\TitanInterfaceRuntime\System\Presentation\ResponsiveHints;

$assert = static function (bool $condition, string $message): void {
    if (!$condition) throw new RuntimeException($message);
};
$component = static fn(string $id, string $authority='presentation-only', bool $responsive=true): array => [
    'id'=>$id,'authority'=>$authority,'responsive'=>$responsive,'accessible'=>true,'actions'=>['unsafe.write'],
];

$vocabulary = new ArrayComponentVocabulary([
    'entity-card'=>$component('entity-card'),
    'stack'=>$component('stack'),
    'unsafe'=>$component('unsafe', 'business-write'),
]);
$adapter = new BuilderPresentationAdapter($vocabulary, new PresentationComponentPolicy());
$known = $adapter->resolve('entity-card', 'card', ResponsiveHints::auto());
$assert($known->componentId === 'entity-card' && !$known->fallback, 'known Builder component did not resolve');
$assert($known->actions === [], 'Builder component actions leaked into Interface Runtime authority');
$unknown = $adapter->resolve('not-real', 'panel', ResponsiveHints::auto());
$assert($unknown->componentId === 'stack' && $unknown->fallback, 'unknown component did not fall back safely');
$unsafe = $adapter->resolve('unsafe', 'panel', ResponsiveHints::auto());
$assert($unsafe->componentId === 'stack' && $unsafe->fallback, 'unsafe component policy did not fail closed');

$treeA = new PresentationTree('command', new PresentationNode('stack','root',['z'=>1,'a'=>['y'=>2,'x'=>1]]), new ResponsiveHints('auto',['md'=>768,'sm'=>576]), ['z'=>2,'a'=>1]);
$treeB = new PresentationTree('command', new PresentationNode('stack','root',['a'=>['x'=>1,'y'=>2],'z'=>1]), new ResponsiveHints('auto',['sm'=>576,'md'=>768]), ['a'=>1,'z'=>2]);
$assert($treeA->toCanonicalJson() === $treeB->toCanonicalJson(), 'presentation serialization is not deterministic');
$assert($treeA->fingerprint() === $treeB->fingerprint(), 'presentation fingerprint is not deterministic');

echo "PASS7_PRESENTATION_BUILDER_ADAPTER_OK\n";
