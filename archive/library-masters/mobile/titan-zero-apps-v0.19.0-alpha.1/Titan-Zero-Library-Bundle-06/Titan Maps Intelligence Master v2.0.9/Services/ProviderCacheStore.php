<?php

declare(strict_types=1);

namespace App\Extensions\TitanMapsIntelligence\Services;

use App\Extensions\TitanMapsIntelligence\Contracts\SpatialSignalPublisher;
use Illuminate\Contracts\Cache\Repository;
use Illuminate\Support\Facades\Cache;

final class ProviderCacheStore
{
    public function __construct(
        private readonly SpatialSignalPublisher $signals,
        private readonly SpatialExecutionContextStore $contexts,
        private readonly SpatialExecutionContextFactory $contextFactory,
    ) {}

    public function repository(): Repository
    {
        try {
            $redis = Cache::store('redis');
            // Force a cheap backend interaction so a misconfigured Redis store is detected here,
            // rather than later while a provider call is already in flight.
            $redis->get('titan-maps:cache-health-probe');
            return $redis;
        } catch (\Throwable $exception) {
            try {
                $context = $this->contexts->current() ?? $this->contextFactory->fromInput('maps.cache.fallback', ['execution_origin'=>'system']);
                $this->signals->publish('maps.cache.fallback', $context, [
                    'preferred_store'=>'redis',
                    'fallback_store'=>'default',
                    'reason_code'=>'MAPS_REDIS_CACHE_UNAVAILABLE',
                    'exception_type'=>$exception::class,
                ]);
            } catch (\Throwable) {
                // Cache fallback must remain available even when Signal is not installed.
            }
            return Cache::store();
        }
    }

    public function remember(string $key, int $ttlSeconds, callable $callback): mixed
    {
        return $this->repository()->remember($key, max(1, $ttlSeconds), $callback);
    }

    public function get(string $key, mixed $default = null): mixed
    {
        return $this->repository()->get($key, $default);
    }

    public function put(string $key, mixed $value, int $ttlSeconds): bool
    {
        return (bool) $this->repository()->put($key, $value, max(1, $ttlSeconds));
    }
}
