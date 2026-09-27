<?php

declare(strict_types=1);

namespace App\Extensions\TempChat\System;

use App\Domains\Marketplace\Contracts\ExtensionRegisterKeyProviderInterface;
use App\Domains\Marketplace\Contracts\UninstallExtensionServiceProviderInterface;
use Illuminate\Contracts\Http\Kernel;
use Illuminate\Routing\Router;
use Illuminate\Support\Facades\Route;
use Illuminate\Support\ServiceProvider;
use App\Extensions\SystemAIChat\System\Capabilities\CapabilityDefinition;
use App\Extensions\SystemAIChat\System\Capabilities\CapabilityRegistry;
use App\Extensions\TempChat\System\Privacy\TemporaryChatPolicy;

/**
 * Author: MagicAI Team <info@liquid-themes.com>
 *
 * @note When you create a new service provider, make sure to add it to the "MarketplaceServiceProvider". Otherwise, your Laravel application won’t recognize this provider, and the related functions won’t work properly.
 * @note If you want to perform a specific action when an extension is uninstalled, you can use the UninstallExtensionServiceProviderInterface. By implementing this interface, you can define custom operations that will be triggered during the uninstallation of the extension.
 * @note The registerKey() method is used to provide a unique identifier for the extension, which is essential for the healthy check and other functionalities.
 */
class TempChatServiceProvider extends ServiceProvider implements ExtensionRegisterKeyProviderInterface, UninstallExtensionServiceProviderInterface
{
    public function register(): void
    {
        $this->registerConfig();
        $this->app->singleton(TemporaryChatPolicy::class, fn () => new TemporaryChatPolicy((array) config('temp-chat', [])));
    }

    public function boot(Kernel $kernel): void
    {
        $this->registerTranslations()
            ->registerViews()
            ->registerRoutes()
            ->registerMigrations()
            ->registerCapabilities()
            ->publishAssets()
            ->registerComponents();

    }


    private function registerCapabilities(): static
    {
        if (! $this->app->bound(CapabilityRegistry::class)) {
            return $this;
        }

        $this->app->make(CapabilityRegistry::class)->register(new CapabilityDefinition(
            key: 'system-ai-chat.temporary-chat',
            label: 'SystemAIChat Temporary Chat',
            description: 'Privacy-aware temporary conversations with explicit retention disclosures.',
            version: '1.5.0',
            dependencies: ['system-ai-chat.runtime'],
            metadata: [
                'history_persistence' => false,
                'configurable_retention' => true,
                'upload_retention_disclosure' => true,
            ],
        ));

        return $this;
    }

    public function registerComponents(): static
    {
        //        $this->loadViewComponentsAs('temp-chat', []);

        return $this;
    }

    public function publishAssets(): static
    {
        $this->publishes([
            __DIR__ . '/../config/tempchat.php' => config_path('temp-chat.php'),
        ], 'temp-chat-config');

        return $this;
    }

    public function registerConfig(): static
    {
        $this->mergeConfigFrom(__DIR__ . '/../config/tempchat.php', 'temp-chat');

        return $this;
    }

    protected function registerTranslations(): static
    {
        $this->loadTranslationsFrom(__DIR__ . '/../resources/lang', 'temp-chat');

        return $this;
    }

    public function registerViews(): static
    {
        $this->loadViewsFrom([__DIR__ . '/../resources/views'], 'temp-chat');

        return $this;
    }

    public function registerMigrations(): static
    {
        $this->loadMigrationsFrom(__DIR__ . '/../database/migrations');

        return $this;
    }

    private function registerRoutes(): static
    {
        return $this;
    }

    private function router(): Router|Route
    {
        return $this->app['router'];
    }

    public static function uninstall(): void
    {
        // No persistent extension-owned records are created by this package.
    }

    public function registerKey(): string
    {
        return 'temp-chat';
    }
}
