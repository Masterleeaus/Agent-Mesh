<?php

declare(strict_types=1);

require_once __DIR__.'/../../System/GenerativeUI/BuilderRegistry.php';
require_once __DIR__.'/../../System/GenerativeUI/GenerativeUiSpecNormaliser.php';
require_once __DIR__.'/../../System/GenerativeUI/GenerativeUiSpecValidator.php';

use App\Extensions\TitanBuilder\System\GenerativeUI\BuilderRegistry;
use App\Extensions\TitanBuilder\System\GenerativeUI\GenerativeUiSpecNormaliser;
use App\Extensions\TitanBuilder\System\GenerativeUI\GenerativeUiSpecValidator;

$registry = new BuilderRegistry(__DIR__.'/../../resources/builder');
$normaliser = new GenerativeUiSpecNormaliser($registry);
$validator = new GenerativeUiSpecValidator($registry, $normaliser);

$assert = static function (bool $condition, string $message): void {
    if (! $condition) {
        throw new RuntimeException($message);
    }
};

$valid = [
    'version' => '1.1',
    'authority' => 'presentation-only',
    'surface' => 'mobile',
    'root' => 'root',
    'state' => ['query' => ''],
    'elements' => [
        'root' => ['type' => 'stack', 'props' => [], 'children' => ['button']],
        'button' => [
            'type' => 'button',
            'props' => ['label' => 'Open job'],
            'on' => ['click' => ['action' => 'navigate', 'params' => ['to' => '/jobs/1']]],
        ],
    ],
];
$result = $validator->validate($valid);
$assert($result['valid'] === true, 'known safe spec should validate: '.json_encode($result['issues']));

$unknownComponent = $valid;
$unknownComponent['elements']['button']['type'] = 'php-eval';
$assert($validator->validate($unknownComponent)['valid'] === false, 'unknown components must fail');

$unknownAction = $valid;
$unknownAction['elements']['button']['on']['click']['action'] = 'workcore.admin.execute-anything';
$assert($validator->validate($unknownAction)['valid'] === false, 'unknown actions must fail');

$unsafeHtml = $valid;
$unsafeHtml['elements']['button']['props']['innerHTML'] = '<script>alert(1)</script>';
$assert($validator->validate($unsafeHtml)['valid'] === false, 'raw HTML/script props must fail');

$unsafeUrl = $valid;
$unsafeUrl['elements']['button']['props']['href'] = 'javascript:alert(1)';
$assert($validator->validate($unsafeUrl)['valid'] === false, 'javascript URLs must fail');

$badPointer = $valid;
$badPointer['elements']['button']['visible'] = ['$state' => '/jobs/~2bad'];
$assert($validator->validate($badPointer)['valid'] === false, 'malformed JSON pointer escape must fail');

$cycle = $valid;
$cycle['elements']['button']['children'] = ['root'];
$assert($validator->validate($cycle)['valid'] === false, 'cyclic element graph must fail');

$unsafeEnv = $valid;
$unsafeEnv['elements']['button']['props']['token'] = ['$env' => 'OPENAI_API_KEY'];
$assert($validator->validate($unsafeEnv)['valid'] === false, 'secret-like environment references must fail');

echo 'PASS generative_ui_test'.PHP_EOL;
