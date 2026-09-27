<?php
declare(strict_types=1);
namespace App\Extensions\TitanMcp\System\Workforce;

final class ProviderHealthProbe implements ProviderHealthProbeContract
{
    public function __construct(
        private readonly WorkforceProviderRuntimeContract $provider,
        private readonly ?object $container = null,
    ) {}

    public function probe(int|string $companyId, int $now): ProviderHealthSnapshot
    {
        $requiredFiles = ["config/titan-mcp.php"];
        foreach ($requiredFiles as $relative) {
            $root = dirname(__DIR__, 2);
            if (!is_file($root . DIRECTORY_SEPARATOR . $relative)) {
                return new ProviderHealthSnapshot($companyId, $this->provider->providerKey(), 'unavailable', 'required_file_missing', $now, $now + 60);
            }
        }

        // Container/dependency checks are intentionally non-mutating and secret-free.
        $optional = ["events", "cache.store"];
        if ($this->container !== null && method_exists($this->container, 'bound')) {
            foreach ($optional as $binding) {
                if (!$this->container->bound($binding)) {
                    return new ProviderHealthSnapshot($companyId, $this->provider->providerKey(), 'degraded', 'optional_dependency_missing', $now, $now + 120);
                }
            }
        }

        return new ProviderHealthSnapshot($companyId, $this->provider->providerKey(), 'healthy', 'probe_ok', $now, $now + 300);
    }
}
