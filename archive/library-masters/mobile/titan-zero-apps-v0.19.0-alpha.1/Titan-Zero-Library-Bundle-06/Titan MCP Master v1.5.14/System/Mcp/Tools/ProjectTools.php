<?php

declare(strict_types=1);

namespace App\Extensions\TitanMcp\System\Mcp\Tools;

use App\Extensions\TitanMcp\System\Mcp\Support\ApplicationContextInspector;
use App\Extensions\TitanMcp\System\Mcp\Support\CapabilityGate;
use App\Extensions\TitanMcp\System\Mcp\Support\ExtensionInspector;
use App\Extensions\TitanMcp\System\Mcp\Support\ModelMetadataInspector;
use Illuminate\Contracts\Foundation\Application;
use Illuminate\Support\Facades\Auth;

final class ProjectTools
{
    public function __construct(
        private readonly Application $app,
        private readonly CapabilityGate $gate,
        private readonly ExtensionInspector $extensions,
        private readonly ApplicationContextInspector $applicationContext,
        private readonly ModelMetadataInspector $models,
    ) {}
    public function projectInfo(): array
    {
        $this->gate->assert(Auth::user(), 'titan.mcp.read');
        $composer = json_decode((string) @file_get_contents(base_path('composer.json')), true) ?: [];
        $package = json_decode((string) @file_get_contents(base_path('package.json')), true) ?: [];
        $extensionSummary = $this->extensions->summary();
        $applicationContext = $this->applicationContext->inspect(
            appName: (string) config('app.name'),
            environment: (string) app()->environment(),
            laravelVersion: (string) $this->app->version(),
            applicationUrl: (string) config('app.url', ''),
            defaultDatabase: (string) config('database.default', ''),
            configuredConnections: array_keys((array) config('database.connections', [])),
            mcpRoutePrefix: (string) config('titan_mcp.http.route_prefix', 'mcp'),
        );

        return [
            'app_name' => config('app.name'),
            'environment' => app()->environment(),
            'php' => PHP_VERSION,
            'laravel' => $this->app->version(),
            'database_driver' => config('database.default'),
            'composer_require' => $composer['require'] ?? [],
            'frontend_dependencies' => $package['dependencies'] ?? [],
            'frontend_dev_dependencies' => $package['devDependencies'] ?? [],
            'application_context' => $applicationContext,
            'extensions_path' => 'app/Extensions',
            'extensions' => [
                'top_level_entries' => $extensionSummary['top_level_entries'],
                'directories' => $extensionSummary['extension_directories'],
                'artifacts' => $extensionSummary['artifacts_count'],
            ],
        ];
    }
    public function extensionsList(): array
    {
        $this->gate->assert(Auth::user(), 'titan.mcp.read');
        return $this->extensions->list();
    }
    public function extensionInspect(string $name): array
    {
        $this->gate->assert(Auth::user(), 'titan.mcp.read');
        $inspection = $this->extensions->inspect($name);
        $inspection['model_metadata'] = $this->models->inspectExtension(
            $name,
            max(1, (int) config('titan_mcp.diagnostics.max_model_metadata', 100)),
        );
        return $inspection;
    }
}
