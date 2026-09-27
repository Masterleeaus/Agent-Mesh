<?php
declare(strict_types=1);
namespace App\Extensions\TitanMcp\System\Workforce;

final class LaravelCacheProviderHealthStore implements ProviderHealthStoreContract
{
    public function __construct(private readonly object $cache) {}

    private function key(int|string $companyId, string $providerKey): string
    {
        return 'titan:workforce:provider-health:' . (string)$companyId . ':' . $providerKey;
    }

    public function put(ProviderHealthSnapshot $snapshot): void
    {
        $ttl = max(1, $snapshot->expiresAt - $snapshot->observedAt);
        $payload = [
            'company_id' => $snapshot->companyId,
            'provider_key' => $snapshot->providerKey,
            'state' => $snapshot->state,
            'reason_code' => $snapshot->reasonCode,
            'observed_at' => $snapshot->observedAt,
            'expires_at' => $snapshot->expiresAt,
        ];
        $this->cache->put($this->key($snapshot->companyId, $snapshot->providerKey), $payload, $ttl);
    }

    public function get(int|string $companyId, string $providerKey, int $now): ?ProviderHealthSnapshot
    {
        $payload = $this->cache->get($this->key($companyId, $providerKey));
        if (!is_array($payload)) { return null; }
        $snapshot = new ProviderHealthSnapshot(
            $payload['company_id'], (string)$payload['provider_key'], (string)$payload['state'],
            (string)$payload['reason_code'], (int)$payload['observed_at'], (int)$payload['expires_at']
        );
        return $snapshot->isFresh($now) ? $snapshot : null;
    }
}
