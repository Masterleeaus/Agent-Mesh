<?php

declare(strict_types=1);

require_once __DIR__.'/../../System/GenerativeUI/BuilderRegistry.php';
require_once __DIR__.'/../../System/GenerativeUI/GenerativeUiSpecNormaliser.php';
require_once __DIR__.'/../../System/GenerativeUI/GenerativeUiSpecValidator.php';

use App\Extensions\TitanBuilder\System\GenerativeUI\BuilderRegistry;
use App\Extensions\TitanBuilder\System\GenerativeUI\GenerativeUiSpecNormaliser;
use App\Extensions\TitanBuilder\System\GenerativeUI\GenerativeUiSpecValidator;

$root = dirname(__DIR__, 2);
$registry = new BuilderRegistry($root.'/resources/builder');
$normaliser = new GenerativeUiSpecNormaliser($registry);
$validator = new GenerativeUiSpecValidator($registry, $normaliser);
$files = glob($root.'/resources/builder/specs/mobile-*.json') ?: [];
if (count($files) !== 18) {
    throw new RuntimeException('Expected 18 Premium mobile specs, found '.count($files));
}

foreach ($files as $file) {
    $spec = json_decode((string) file_get_contents($file), true, 512, JSON_THROW_ON_ERROR);
    $result = $validator->validate($spec);
    if (! $result['valid']) {
        throw new RuntimeException(basename($file).' failed validation: '.json_encode($result['issues']));
    }
    if (($spec['meta']['company_boundary'] ?? null) !== 'company_id') {
        throw new RuntimeException(basename($file).' does not declare company_id boundary');
    }
}

echo 'PASS premium_mobilekit_specs ('.count($files).' renderable specs)'.PHP_EOL;
