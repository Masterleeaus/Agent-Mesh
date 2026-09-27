<?php

declare(strict_types=1);

namespace App\Extensions\TitanMapsIntelligence\Providers;

use App\Extensions\TitanMapsIntelligence\Contracts\PlacesProvider;
use App\Extensions\TitanMapsIntelligence\Exceptions\ProviderException;
use Closure;

final class PlacesProviderRegistry
{
    /** @var array<string, PlacesProvider> */
    private array $providers = [];

    /** @var array<string, Closure(?string): PlacesProvider> */
    private array $factories = [];

    public function register(PlacesProvider $provider): void
    {
        $this->providers[$provider->id()] = $provider;
    }

    public function registerFactory(string $id, callable $factory): void
    {
        $this->factories[$id] = Closure::fromCallable($factory);
    }

    public function get(string $id, ?string $companyId = null): PlacesProvider
    {
        if (isset($this->providers[$id])) {
            return $this->providers[$id];
        }
        if (isset($this->factories[$id])) {
            return ($this->factories[$id])($companyId);
        }

        throw ProviderException::fromCode('MAPS_PROVIDER_NOT_CONFIGURED', 'The requested places provider is not registered.', ['provider' => $id]);
    }

    public function ids(): array
    {
        return array_values(array_unique(array_merge(array_keys($this->providers), array_keys($this->factories))));
    }
}
