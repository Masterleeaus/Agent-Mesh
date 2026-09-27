<?php

declare(strict_types=1);

namespace App\Extensions\TitanBuilder\System;

use App\Domains\Marketplace\Contracts\ExtensionRegisterKeyProviderInterface;
use App\Domains\Marketplace\Contracts\UninstallExtensionServiceProviderInterface;
use App\Extensions\TitanBuilder\System\AI\TitanAIAiUiGenerator;
use App\Extensions\TitanBuilder\System\AI\UnavailableAiUiGenerator;
use App\Extensions\TitanBuilder\System\Assets\AssetReferenceGuard;
use App\Extensions\TitanBuilder\System\Assets\AssetUploadService;
use App\Extensions\TitanBuilder\System\Audit\BuilderAuditLogger;
use App\Extensions\TitanBuilder\System\Capabilities\ConfiguredCapabilityDiscovery;
use App\Extensions\TitanBuilder\System\Contracts\ActionCatalog;
use App\Extensions\TitanBuilder\System\Contracts\AiUiGenerator;
use App\Extensions\TitanBuilder\System\Contracts\ApplicationProvisioningGateway;
use App\Extensions\TitanBuilder\System\Contracts\CapabilityDiscovery;
use App\Extensions\TitanBuilder\System\Contracts\ComponentRegistry;
use App\Extensions\TitanBuilder\System\Contracts\CrmBusinessConfigurationGateway;
use App\Extensions\TitanBuilder\System\Contracts\DataSourceCatalog;
use App\Extensions\TitanBuilder\System\Contracts\DataSourceProvider;
use App\Extensions\TitanBuilder\System\Contracts\MobileApplicationDefinitionPublisher;
use App\Extensions\TitanBuilder\System\Contracts\PageRepository;
use App\Extensions\TitanBuilder\System\Contracts\PreviewRenderer;
use App\Extensions\TitanBuilder\System\Contracts\Publisher;
use App\Extensions\TitanBuilder\System\Contracts\SurfaceRegistry;
use App\Extensions\TitanBuilder\System\Contracts\TemplateRegistry;
use App\Extensions\TitanBuilder\System\Contracts\ThemeRegistry;
use App\Extensions\TitanBuilder\System\Contracts\TitanAiRuntimeGateway;
use App\Extensions\TitanBuilder\System\Contracts\VerticalContextProvider;
use App\Extensions\TitanBuilder\System\Data\CrmBuilderDataSourceProvider;
use App\Extensions\TitanBuilder\System\GenerativeUI\BuilderRegistry;
use App\Extensions\TitanBuilder\System\GenerativeUI\GenerativeUiResponseComposer;
use App\Extensions\TitanBuilder\System\GenerativeUI\GenerativeUiSpecNormaliser;
use App\Extensions\TitanBuilder\System\GenerativeUI\GenerativeUiSpecValidator;
use App\Extensions\TitanBuilder\System\Interaction\InteractionUiContractNormalizer;
use App\Extensions\TitanBuilder\System\Migration\LegacyBusinessSpecMigrator;
use App\Extensions\TitanBuilder\System\Mobile\JsonMobileApplicationDefinitionPublisher;
use App\Extensions\TitanBuilder\System\Management\BuilderSettingsRepository;
use App\Extensions\TitanBuilder\System\Management\ManagementDashboardService;
use App\Extensions\TitanBuilder\System\Preview\ValidatedPreviewRenderer;
use App\Extensions\TitanBuilder\System\Provisioning\ApplicationReadinessService;
use App\Extensions\TitanBuilder\System\Provisioning\BrandConfigurationValidator;
use App\Extensions\TitanBuilder\System\Provisioning\EloquentApplicationProvisioningGateway;
use App\Extensions\TitanBuilder\System\Publishing\VersionedPublisher;
use App\Extensions\TitanBuilder\System\Registries\JsonComponentRegistry;
use App\Extensions\TitanBuilder\System\Registries\JsonDataSourceCatalog;
use App\Extensions\TitanBuilder\System\Registries\JsonSurfaceRegistry;
use App\Extensions\TitanBuilder\System\Registries\JsonTemplateRegistry;
use App\Extensions\TitanBuilder\System\Registries\JsonThemeRegistry;
use App\Extensions\TitanBuilder\System\Registries\ManifestActionCatalog;
use App\Extensions\TitanBuilder\System\Repositories\EloquentPageRepository;
use App\Extensions\TitanBuilder\System\Security\BuilderAuthorization;
use App\Extensions\TitanBuilder\System\Services\Builder\MobilekitPremiumCatalogue;
use App\Extensions\TitanBuilder\System\Verticals\CrmVerticalContextProvider;
use App\Extensions\TitanBuilder\System\Verticals\NullVerticalContextProvider;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\ServiceProvider;

final class TitanBuilderServiceProvider extends ServiceProvider implements ExtensionRegisterKeyProviderInterface, UninstallExtensionServiceProviderInterface
{
    public function register(): void
    {
        $this->mergeConfigFrom(__DIR__.'/../config/titan-builder.php', 'titan-builder');

        $this->app->singleton(BuilderRegistry::class, fn (): BuilderRegistry => new BuilderRegistry(__DIR__.'/../resources/builder'));
        $this->app->singleton(MobilekitPremiumCatalogue::class);
        $this->app->singleton(LegacyBusinessSpecMigrator::class);
        $this->app->singleton(InteractionUiContractNormalizer::class);
        $this->app->singleton(BuilderAuditLogger::class);
        $this->app->singleton(BuilderSettingsRepository::class);
        $this->app->singleton(ManagementDashboardService::class);
        $this->app->scoped(BuilderAuthorization::class);

        $this->app->singleton(ComponentRegistry::class, JsonComponentRegistry::class);
        $this->app->singleton(TemplateRegistry::class, JsonTemplateRegistry::class);
        $this->app->singleton(ThemeRegistry::class, JsonThemeRegistry::class);
        $this->app->singleton(SurfaceRegistry::class, JsonSurfaceRegistry::class);

        if (! $this->app->bound(CapabilityDiscovery::class)) {
            $this->app->singleton(CapabilityDiscovery::class, ConfiguredCapabilityDiscovery::class);
        }
        if (! $this->app->bound(ActionCatalog::class)) {
            $this->app->singleton(ActionCatalog::class, ManifestActionCatalog::class);
        }
        if (! $this->app->bound(DataSourceCatalog::class)) {
            $this->app->singleton(DataSourceCatalog::class, JsonDataSourceCatalog::class);
        }
        $this->app->singleton(DataSourceProvider::class, CrmBuilderDataSourceProvider::class);

        $this->app->singleton(GenerativeUiSpecNormaliser::class);
        $this->app->singleton(GenerativeUiSpecValidator::class);
        $this->app->singleton(GenerativeUiResponseComposer::class, fn ($app): GenerativeUiResponseComposer => new GenerativeUiResponseComposer(
            $app->make(BuilderRegistry::class),
            $app->make(GenerativeUiSpecNormaliser::class),
            $app->make(GenerativeUiSpecValidator::class),
            (array) config('titan-builder.generative_ui', []),
            $app->make(ActionCatalog::class),
            $app->make(DataSourceCatalog::class),
        ));

        $this->app->singleton(AssetReferenceGuard::class);
        $this->app->singleton(AssetUploadService::class);
        $this->app->bind(PageRepository::class, EloquentPageRepository::class);
        $this->app->bind(PreviewRenderer::class, ValidatedPreviewRenderer::class);
        $this->app->bind(Publisher::class, VersionedPublisher::class);

        if (! $this->app->bound(AiUiGenerator::class)) {
            if ($this->app->bound(TitanAiRuntimeGateway::class)) {
                $this->app->singleton(AiUiGenerator::class, TitanAIAiUiGenerator::class);
            } else {
                $this->app->singleton(AiUiGenerator::class, UnavailableAiUiGenerator::class);
            }
        }
        if (! $this->app->bound(VerticalContextProvider::class)) {
            if ($this->app->bound(CrmBusinessConfigurationGateway::class)) {
                $this->app->singleton(VerticalContextProvider::class, CrmVerticalContextProvider::class);
            } else {
                $this->app->singleton(VerticalContextProvider::class, NullVerticalContextProvider::class);
            }
        }

        $this->app->singleton(BrandConfigurationValidator::class);
        $this->app->singleton(ApplicationReadinessService::class);
        $this->app->bind(MobileApplicationDefinitionPublisher::class, JsonMobileApplicationDefinitionPublisher::class);
        $this->app->bind(ApplicationProvisioningGateway::class, EloquentApplicationProvisioningGateway::class);
    }

    public function boot(): void
    {
        $this->loadMigrationsFrom(__DIR__.'/../database/migrations');
        $this->loadRoutesFrom(__DIR__.'/../routes/api.php');
        $this->loadRoutesFrom(__DIR__.'/../routes/web.php');
        $this->loadViewsFrom(__DIR__.'/../resources/views', 'titan-builder');

        $extensionPublishables = [
            __DIR__.'/../config/titan-builder.php' => config_path('titan-builder.php'),
            __DIR__.'/../resources/builder' => resource_path('titan-builder'),
            __DIR__.'/../resources/assets/js/titan-generative-ui.js' => public_path('vendor/titan-builder/js/titan-generative-ui.js'),
            __DIR__.'/../resources/assets/css/titan-generative-ui.css' => public_path('vendor/titan-builder/css/titan-generative-ui.css'),
            __DIR__.'/../resources/js/titan-shell-builder.js' => public_path('vendor/titan-builder/js/titan-shell-builder.js'),
            __DIR__.'/../resources/assets/js/titan-mobilekit-premium.js' => public_path('vendor/titan-builder/premium/mobilekit/titan-mobilekit-premium.js'),
            __DIR__.'/../resources/assets/css/titan-mobilekit-premium.css' => public_path('vendor/titan-builder/premium/mobilekit/titan-mobilekit-premium.css'),
            __DIR__.'/../resources/assets/js/titan-builder-management.js' => public_path('vendor/titan-builder/management/titan-builder-management.js'),
            __DIR__.'/../resources/assets/css/titan-builder-management.css' => public_path('vendor/titan-builder/management/titan-builder-management.css'),
        ];

        $this->publishes($extensionPublishables, 'titan-builder');
        $this->publishes([__DIR__.'/../resources/builder' => resource_path('titan-builder')], 'titan-builder-resources');
        $this->publishes([__DIR__.'/../config/titan-builder.php' => config_path('titan-builder.php')], 'titan-builder-config');
    }

    public function registerKey(): string { return 'titan-builder'; }

    public static function uninstall(): void
    {
        $builderPermissions = ['builder.read', 'builder.edit', 'builder.publish', 'builder.assets.manage', 'builder.templates.manage', 'builder.admin'];
        if (Schema::hasTable('permissions')) {
            $permissionIds = DB::table('permissions')
                ->where('guard_name', 'web')
                ->whereIn('name', ['builder.read', 'builder.edit', 'builder.publish', 'builder.assets.manage', 'builder.templates.manage', 'builder.admin'])
                ->pluck('id')
                ->all();

            if ($permissionIds !== [] && Schema::hasTable('role_has_permissions')) {
                DB::table('role_has_permissions')->whereIn('permission_id', $permissionIds)->delete();
            }

            DB::table('permissions')
                ->where('guard_name', 'web')
                ->whereIn('name', $builderPermissions)
                ->delete();
        }

        if (class_exists(\Spatie\Permission\PermissionRegistrar::class)) {
            app(\Spatie\Permission\PermissionRegistrar::class)->forgetCachedPermissions();
        }

        if (Schema::hasTable('menus')) {
            DB::table('menus')
                ->where('key', 'titan_builder')
                ->orWhere('key', 'like', 'titan_builder_%')
                ->delete();
        }

        File::delete(config_path('titan-builder.php'));
        File::deleteDirectory(resource_path('titan-builder'));
        File::deleteDirectory(public_path('vendor/titan-builder'));
    }
}
