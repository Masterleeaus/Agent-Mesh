<?php

declare(strict_types=1);

namespace App\Extensions\InteractionEngine\System\Http\Controllers;

use App\Extensions\InteractionEngine\System\Capabilities\CapabilityProviderRegistry;
use App\Extensions\InteractionEngine\System\Contracts\InteractionEngineManagerContract;
use App\Extensions\InteractionEngine\System\Settings\SettingsPolicy;
use App\Extensions\InteractionEngine\System\Settings\SettingsRepository;
use App\Extensions\InteractionEngine\System\Settings\SettingsResolver;
use App\Extensions\InteractionEngine\System\Release\CurrentRelease;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\View\View;

final class AdminSettingsController
{
    public function __construct(
        private readonly SettingsRepository $repository,
        private readonly SettingsResolver $settings,
        private readonly SettingsPolicy $policy,
        private readonly InteractionEngineManagerContract $manager,
        private readonly CapabilityProviderRegistry $providers,
        private readonly CurrentRelease $release,
    ) {}

    public function overview(): View
    {
        return view('interaction-engine::settings.admin-overview', [
            'settings' => $this->settings->platformSnapshot(),
            'secrets' => $this->secretStatus(),
            'health' => $this->manager->health(),
            'providers' => $this->providerStatus(),
            'version' => $this->release->version(),
        ]);
    }

    public function index(): View
    {
        return view('interaction-engine::settings.admin', [
            'settings' => $this->settings->platformSnapshot(),
            'secrets' => $this->secretStatus(),
            'health' => $this->manager->health(),
            'providers' => $this->providerStatus(),
            'version' => $this->release->version(),
        ]);
    }

    public function update(Request $request): RedirectResponse
    {
        $clean = $this->policy->sanitizePlatform($request->all());
        $actorId = data_get($request->user(), 'id');
        $this->repository->putPlatformMany($clean, $actorId === null ? null : (string) $actorId);

        return redirect()->back()->with('status', 'Interaction Engine platform settings updated.');
    }

    /** @return array<string,array{supported:int,declared:int}> */
    private function providerStatus(): array
    {
        $providerStatus = [];
        foreach ($this->providers->all() as $key => $provider) {
            $descriptors = $provider->descriptors();
            $supported = count(array_filter(array_keys($descriptors), static fn (string $capability): bool => $provider->supports($capability)));
            $providerStatus[$key] = ['supported' => $supported, 'declared' => count($descriptors)];
        }
        return $providerStatus;
    }

    private function secretStatus(): array
    {
        return $this->settings->secretStatus();
    }
}
