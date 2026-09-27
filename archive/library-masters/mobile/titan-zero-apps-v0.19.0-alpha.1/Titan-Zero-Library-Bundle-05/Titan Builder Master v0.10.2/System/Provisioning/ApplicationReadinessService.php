<?php

declare(strict_types=1);

namespace App\Extensions\TitanBuilder\System\Provisioning;

use App\Extensions\TitanBuilder\System\Contracts\ActionCatalog;
use App\Extensions\TitanBuilder\System\Contracts\CapabilityDiscovery;
use App\Extensions\TitanBuilder\System\Contracts\DataSourceCatalog;
use App\Extensions\TitanBuilder\System\Contracts\PageRepository;
use App\Extensions\TitanBuilder\System\GenerativeUI\BuilderRegistry;
use App\Extensions\TitanBuilder\System\Models\BuilderProject;

final class ApplicationReadinessService
{
    public function __construct(
        private readonly BuilderRegistry $registry,
        private readonly PageRepository $pages,
        private readonly ActionCatalog $actions,
        private readonly DataSourceCatalog $dataSources,
        private readonly CapabilityDiscovery $capabilities,
    ) {}

    /** @return array{status:string,reasons:list<array{code:string,severity:string,message:string}>} */
    public function assess(int $companyId, BuilderProject $project): array
    {
        $reasons = [];
        $app = (array) (($project->meta ?? [])['application'] ?? []);
        $surface = (string) ($app['surface'] ?? $project->surface ?? '');
        $add = static function (array &$reasons, string $code, string $severity, string $message): void {
            $reasons[] = compact('code','severity','message');
        };

        if ((int) $project->company_id !== $companyId) {
            $add($reasons, 'company-mismatch', 'blocked', 'Application does not belong to the current company.');
        }
        if (! in_array($surface, ['customer','field','owner','onboarding'], true)) {
            $add($reasons, 'surface-invalid', 'blocked', 'Application surface is not registered.');
        }
        $theme = (string) ($app['theme'] ?? '');
        if ($theme === '' || $this->registry->find('themes', $theme) === null) {
            $add($reasons, 'theme-invalid', 'blocked', 'Application theme is missing or invalid.');
        }
        $pageRecords = $this->pages->pagesForProject($companyId, (int) $project->getKey());
        if ($pageRecords === []) {
            $add($reasons, 'pages-missing', 'blocked', 'Application has no Builder pages.');
        }
        foreach ((array) ($app['data_sources'] ?? []) as $source) {
            $definition = is_string($source) ? $this->dataSources->find($source) : null;
            if (! $definition) {
                $add($reasons, 'data-source-unknown', 'blocked', 'Application references an unknown data source.');
                continue;
            }
            $compatible = array_values((array) ($definition['surface_compatibility'] ?? []));
            if ($compatible !== [] && ! in_array($surface, $compatible, true)) {
                $add($reasons, 'data-source-surface-incompatible', 'blocked', 'Data source is not compatible with this application surface: '.$source);
                continue;
            }
            $required = $definition['required_capability'] ?? null;
            if (is_string($required) && $required !== '' && ! $this->capabilities->has($required, $companyId)) {
                $add($reasons, 'data-source-capability-missing', 'blocked', 'Data source capability is unavailable: '.$required);
            }
        }
        foreach ((array) ($app['action_intents'] ?? []) as $action) {
            $definition = is_string($action) ? $this->actions->find($action) : null;
            if (! $definition) {
                $add($reasons, 'action-unknown', 'blocked', 'Application references an unknown action intent.');
                continue;
            }
            $compatible = array_values((array) ($definition['surface_compatibility'] ?? []));
            if ($compatible !== [] && ! in_array($surface, $compatible, true)) {
                $add($reasons, 'action-surface-incompatible', 'blocked', 'Action is not compatible with this application surface: '.$action);
                continue;
            }
            $required = $definition['required_capability'] ?? null;
            if (is_string($required) && $required !== '' && ! $this->capabilities->has($required, $companyId)) {
                $add($reasons, 'action-capability-missing', 'blocked', 'Action capability is unavailable: '.$required);
            }
        }
        $surfaceDefinition = $this->registry->find('surfaces', $surface) ?? [];
        foreach ((array) ($surfaceDefinition['required_capabilities'] ?? []) as $capability) {
            if (is_string($capability) && ! $this->capabilities->has($capability, $companyId)) {
                $add($reasons, 'capability-missing', 'blocked', 'Required capability is unavailable: '.$capability);
            }
        }
        $enabledPages = array_values(array_filter((array) ($app['enabled_pages'] ?? []), 'is_string'));
        if ($enabledPages !== []) {
            $existingPageSlugs = array_map(static fn ($page): string => (string) $page->slug, $pageRecords);
            foreach (array_diff($enabledPages, $existingPageSlugs) as $missingPage) {
                $add($reasons, 'enabled-page-missing', 'blocked', 'Configured page does not exist: '.$missingPage);
            }
        }
        if (($app['vertical_pending_crm'] ?? false) === true) {
            $add($reasons, 'crm-vertical-unconfirmed', 'blocked', 'CRM has not confirmed the application vertical.');
        }
        if (($app['migration_review_required'] ?? false) === true) {
            $add($reasons, 'migration-review', 'warning', 'Legacy Builder configuration requires migration review.');
        }

        $status = 'ready';
        foreach ($reasons as $reason) {
            if ($reason['severity'] === 'blocked') { $status = 'blocked'; break; }
            if ($reason['severity'] === 'warning') { $status = 'warning'; }
        }
        return ['status' => $status, 'reasons' => $reasons];
    }
}
