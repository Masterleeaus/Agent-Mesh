<?php

declare(strict_types=1);

$root = dirname(__DIR__, 2);
foreach ([
    'System/Contracts/CapabilityDiscovery.php',
    'System/Contracts/DataSourceProvider.php',
    'System/GenerativeUI/BuilderRegistry.php',
    'System/Data/DataSourceDefinition.php',
    'System/Data/CrmBuilderDataSourceProvider.php',
] as $file) { require_once $root.'/'.$file; }

use App\Extensions\TitanBuilder\System\Contracts\CapabilityDiscovery;
use App\Extensions\TitanBuilder\System\Data\CrmBuilderDataSourceProvider;
use App\Extensions\TitanBuilder\System\GenerativeUI\BuilderRegistry;

final class FakeCrmCapabilities implements CapabilityDiscovery
{
    public function has(string $capability, ?int $companyId = null): bool
    {
        return $companyId === 42 && in_array($capability, ['crm.customer.operations','crm.business.configuration'], true);
    }
    public function available(?int $companyId = null): array
    {
        return $companyId === 42 ? ['crm.customer.operations','crm.business.configuration'] : [];
    }
}

$registry = new BuilderRegistry($root.'/resources/builder');
$provider = new CrmBuilderDataSourceProvider($registry, new FakeCrmCapabilities());
$definitions = $provider->definitions(42);
if (count($definitions) < 15) { throw new RuntimeException('CRM provider returned an unexpectedly small catalog.'); }
$seenUnavailable = false;
foreach ($definitions as $definition) {
    if (($definition['provider'] ?? null) !== 'crm' || ($definition['read_only'] ?? null) !== true) {
        throw new RuntimeException('CRM data-source contract is not read-only CRM.');
    }
    if (! str_starts_with((string) ($definition['contract'] ?? ''), 'crm.')) {
        throw new RuntimeException('CRM data-source contract namespace is invalid.');
    }
    if (($definition['available'] ?? null) === false) { $seenUnavailable = true; }
}
if (! $seenUnavailable) { throw new RuntimeException('Capability discovery did not fail closed for unavailable CRM sources.'); }
$source = file_get_contents($root.'/System/Data/CrmBuilderDataSourceProvider.php') ?: '';
if (preg_match('/Eloquent|Models\\\\|->query\(|DB::/i', $source)) {
    throw new RuntimeException('CRM Builder provider must not depend on CRM/Eloquent persistence.');
}

echo "CRM data-source provider PASS\n";
