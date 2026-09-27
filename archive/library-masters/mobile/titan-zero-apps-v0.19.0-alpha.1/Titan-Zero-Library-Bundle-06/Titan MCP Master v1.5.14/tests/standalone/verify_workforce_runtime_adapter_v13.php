<?php
declare(strict_types=1);
$root = dirname(__DIR__, 2);
$base = $root . '/System/Workforce/';
foreach ([
 'WorkforceProviderRuntimeContract.php','ProviderHealthSnapshot.php','ProviderHealthRegistry.php',
 'PackageWorkforceProviderAdapter.php','CapabilityAvailability.php','CapabilityResolver.php','ProviderSelector.php'
] as $file) { require_once $base . $file; }

use App\Extensions\TitanMcp\System\Workforce\PackageWorkforceProviderAdapter;
use App\Extensions\TitanMcp\System\Workforce\ProviderHealthSnapshot;
use App\Extensions\TitanMcp\System\Workforce\ProviderHealthRegistry;
use App\Extensions\TitanMcp\System\Workforce\CapabilityResolver;
use App\Extensions\TitanMcp\System\Workforce\ProviderSelector;

$provider = PackageWorkforceProviderAdapter::fromPackageRoot($root);
$cap = $provider->capabilities()[0] ?? null;
if (!$cap) { fwrite(STDERR, "No capability published\n"); exit(1); }
$health = new ProviderHealthRegistry();
$resolver = new CapabilityResolver($health);

$missing = $resolver->resolve($provider, 7, $cap, 100, true, true);
if ($missing->state !== 'unavailable') { fwrite(STDERR, "Must fail closed without health\n"); exit(1); }

$health->observe(new ProviderHealthSnapshot(7, $provider->providerKey(), 'healthy', 'probe_ok', 100, 400));
$ok = $resolver->resolve($provider, 7, $cap, 101, true, true);
if ($ok->state !== 'available') { fwrite(STDERR, "Healthy provider should resolve available\n"); exit(1); }

$denied = $resolver->resolve($provider, 7, $cap, 101, true, false);
if ($denied->state !== 'blocked') { fwrite(STDERR, "Authority denial must block\n"); exit(1); }

$stale = $resolver->resolve($provider, 7, $cap, 401, true, true);
if ($stale->state !== 'unavailable') { fwrite(STDERR, "Stale health must fail closed\n"); exit(1); }

$selector = new ProviderSelector();
if ($selector->select([$ok, $ok]) !== null) { fwrite(STDERR, "Ambiguous providers must require pinning\n"); exit(1); }
if ($selector->select([$ok, $ok], $provider->providerKey()) === null) { fwrite(STDERR, "Pinned provider must resolve\n"); exit(1); }

echo "WORKFORCE_RUNTIME_ADAPTER_V13: PASS\n";
