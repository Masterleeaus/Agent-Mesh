<?php

declare(strict_types=1);

require_once __DIR__.'/../../System/TitanShell/PlatformApplicationRegistry.php';
require_once __DIR__.'/../../System/TitanShell/TemplateSchema.php';

use App\Extensions\TitanBuilder\System\TitanShell\PlatformApplicationRegistry;
use App\Extensions\TitanBuilder\System\TitanShell\TemplateSchema;

$assert = static function (bool $condition, string $message): void {
    if (! $condition) throw new RuntimeException($message);
};

$assert(PlatformApplicationRegistry::canonicalSlug('titan-customer') === 'titan-hub', 'legacy Titan Customer must map to Titan Hub');
$assert(PlatformApplicationRegistry::canonicalSlug('titan-dispatch') === 'titan-go', 'legacy Titan Dispatch must map to Titan Go');
$assert(PlatformApplicationRegistry::canonicalSlug('titan-zero') === 'titan-command', 'legacy Titan Zero shell must map to Titan Command');
$assert(PlatformApplicationRegistry::canonicalSlug('titan-owner') === 'titan-command', 'legacy Titan Owner must map to Titan Command');

$customer = TemplateSchema::resolve('titan-hub');
$field = TemplateSchema::resolve('titan-go');
$owner = TemplateSchema::resolve('titan-command');
$onboarding = TemplateSchema::resolve('titan-onboarding');
$assert($customer['application']['surface'] === 'customer', 'customer surface mismatch');
$assert($field['application']['surface'] === 'field', 'field surface mismatch');
$assert($owner['application']['surface'] === 'owner', 'owner surface mismatch');
$assert($onboarding['application']['surface'] === 'onboarding', 'onboarding surface mismatch');
$assert(($customer['identity']['name'] ?? null) === 'Titan Hub', 'Titan Hub product identity mismatch');
$assert(($field['identity']['name'] ?? null) === 'Titan Go', 'Titan Go product identity mismatch');
$assert(($owner['identity']['name'] ?? null) === 'Titan Command', 'Titan Command product identity mismatch');
$assert(($onboarding['identity']['name'] ?? null) === 'Titan Onboarding', 'Titan Onboarding product identity mismatch');
$assert(($field['offline']['mode'] ?? null) === 'offline-first', 'Titan Go must remain offline-first');
$assert(($owner['offline']['mode'] ?? null) === 'online-first-read-only-cache', 'Titan Command offline fallback must remain read-only cache');
$assert(count(TemplateSchema::all()) === 4, 'exactly four first-party mobile application schemas expected');

echo 'PASS template_surface_test'.PHP_EOL;
