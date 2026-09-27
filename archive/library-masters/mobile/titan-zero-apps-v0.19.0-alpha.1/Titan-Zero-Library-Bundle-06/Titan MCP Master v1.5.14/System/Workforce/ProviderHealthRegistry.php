<?php
declare(strict_types=1);
namespace App\Extensions\TitanMcp\System\Workforce;

final class ProviderHealthRegistry
{
    /** @var array<string,ProviderHealthSnapshot> */
    private array $snapshots = [];

    public function __construct(private readonly ?ProviderHealthStoreContract $store = null) {}

    private function key(int|string $companyId, string $providerKey): string
    {
        return (string)$companyId . ':' . $providerKey;
    }

    public function observe(ProviderHealthSnapshot $snapshot): void
    {
        $this->snapshots[$this->key($snapshot->companyId, $snapshot->providerKey)] = $snapshot;
        $this->store?->put($snapshot);
    }

    public function current(int|string $companyId, string $providerKey, int $now): ProviderHealthSnapshot
    {
        $key = $this->key($companyId, $providerKey);
        $snapshot = $this->snapshots[$key] ?? $this->store?->get($companyId, $providerKey, $now);
        if ($snapshot instanceof ProviderHealthSnapshot && $snapshot->isFresh($now)) {
            return $snapshot;
        }
        return new ProviderHealthSnapshot($companyId, $providerKey, 'unavailable', 'missing_or_stale_health', $now, $now + 1);
    }
}
