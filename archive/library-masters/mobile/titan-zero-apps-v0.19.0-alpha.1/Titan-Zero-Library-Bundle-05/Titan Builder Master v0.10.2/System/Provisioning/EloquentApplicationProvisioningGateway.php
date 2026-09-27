<?php

declare(strict_types=1);

namespace App\Extensions\TitanBuilder\System\Provisioning;

use App\Extensions\TitanBuilder\System\Audit\BuilderAuditLogger;
use App\Extensions\TitanBuilder\System\Contracts\ActionCatalog;
use App\Extensions\TitanBuilder\System\Contracts\ApplicationProvisioningGateway;
use App\Extensions\TitanBuilder\System\Contracts\CapabilityDiscovery;
use App\Extensions\TitanBuilder\System\Contracts\DataSourceCatalog;
use App\Extensions\TitanBuilder\System\Contracts\MobileApplicationDefinitionPublisher;
use App\Extensions\TitanBuilder\System\Contracts\PageRepository;
use App\Extensions\TitanBuilder\System\Contracts\Publisher;
use App\Extensions\TitanBuilder\System\Contracts\VerticalContextProvider;
use App\Extensions\TitanBuilder\System\GenerativeUI\BuilderRegistry;
use App\Extensions\TitanBuilder\System\GenerativeUI\GenerativeUiSpecValidator;
use App\Extensions\TitanBuilder\System\Models\BuilderPage;
use App\Extensions\TitanBuilder\System\Models\BuilderProject;
use App\Extensions\TitanBuilder\System\Models\BuilderTheme;
use InvalidArgumentException;

/** Company-scoped provisioning facade. It edits Builder configuration, never CRM records. */
final class EloquentApplicationProvisioningGateway implements ApplicationProvisioningGateway
{
    private const SURFACES = ['customer','field','owner','onboarding'];

    public function __construct(
        private readonly BuilderRegistry $registry,
        private readonly PageRepository $pages,
        private readonly Publisher $publisher,
        private readonly MobileApplicationDefinitionPublisher $mobile,
        private readonly ApplicationReadinessService $readiness,
        private readonly BrandConfigurationValidator $brandValidator,
        private readonly GenerativeUiSpecValidator $specValidator,
        private readonly ActionCatalog $actions,
        private readonly DataSourceCatalog $dataSources,
        private readonly CapabilityDiscovery $capabilities,
        private readonly VerticalContextProvider $verticalContext,
        private readonly BuilderAuditLogger $auditLogger,
    ) {}

    public function getApplications(int $companyId): array
    {
        $apps = [];
        foreach (self::SURFACES as $surface) {
            $app = $this->getApplication($companyId, $surface);
            if ($app !== null) { $apps[] = $app; }
        }
        return $apps;
    }

    public function getApplication(int $companyId, string $surface): ?array
    {
        $project = $this->project($companyId, $surface, false);
        return $project ? $this->draftDefinition($companyId, $project) : null;
    }

    public function createApplication(int $companyId, string $surface, ?string $actorId = null, array $audit = []): array
    {
        $this->assertSurface($surface);
        $surfaceDefinition = $this->registry->find('surfaces', $surface) ?? throw new InvalidArgumentException('Surface definition is unavailable.');
        $template = $this->registry->find('templates', $surface) ?? throw new InvalidArgumentException('Surface template is unavailable.');
        $slug = 'titan-application-'.$surface;
        $project = BuilderProject::query()->forCompany($companyId)->where('slug', $slug)->first();
        if (! $project) {
            $app = [
                'schema_version' => 'titan-application/1',
                'surface' => $surface,
                'product' => (string) ($surfaceDefinition['product'] ?? $surfaceDefinition['name'] ?? $surface),
                'identity' => (array) ($template['identity'] ?? []),
                'brand' => ['inherit' => 'company-brand', 'overrides' => []],
                'navigation' => (array) ($template['navigation'] ?? []),
                'features' => [],
                'theme' => 'mobilekit-premium',
                'data_sources' => array_values((array) (($template['data'] ?? [])['sources'] ?? [])),
                'action_intents' => array_values((array) (($template['actions'] ?? [])['intents'] ?? [])),
                'assistant' => (array) ($template['assistant'] ?? []),
                'notifications' => array_values((array) ($template['notifications'] ?? [])),
                'privacy' => (array) ($template['privacy'] ?? []),
                'offline' => (array) ($template['offline'] ?? []),
                'settings' => ['sections' => array_values((array) ($template['settings_sections'] ?? []))],
                'enabled_pages' => [],
                'state' => 'draft',
            ];
            $project = BuilderProject::query()->create([
                'company_id' => $companyId,
                'name' => (string) $app['product'],
                'slug' => $slug,
                'surface' => $surface,
                'meta' => ['application' => $app],
            ]);
            $this->seedDefaultPage($companyId, $project, $template, $actorId);
            $meta = (array) $project->fresh()->meta;
            $meta['application']['enabled_pages'] = array_values(array_unique(array_filter([(string) (($template['default_page'] ?? [])['slug'] ?? '')])));
            $project->forceFill(['meta' => $meta])->save();
            $this->record($companyId, $actorId, 'builder.application.create', $project, $audit);
        }
        return $this->draftDefinition($companyId, $project);
    }

    public function provisionApplicationSet(int $companyId, array $configuration = [], ?string $actorId = null, array $audit = []): array
    {
        $allowed = array_intersect_key($configuration, array_flip(['brand','vertical','identity','features','navigation','theme','assistant','privacy','notifications','offline','pages']));
        foreach (self::SURFACES as $surface) {
            $this->createApplication($companyId, $surface, $actorId, $audit);
        }

        if (isset($allowed['brand']) && is_array($allowed['brand'])) {
            $this->configureSharedBrand($companyId, $allowed['brand'], $actorId, $audit);
        }

        if (isset($allowed['vertical']) && is_string($allowed['vertical']) && $allowed['vertical'] !== '') {
            foreach (['customer','field','owner'] as $surface) {
                $this->applyVerticalPack($companyId, $surface, $allowed['vertical'], $actorId, $audit);
            }
        }

        foreach (['identity','features','navigation','theme','assistant','privacy','notifications','offline','pages'] as $section) {
            if (! isset($allowed[$section]) || ! is_array($allowed[$section])) { continue; }
            foreach (self::SURFACES as $surface) {
                if (! array_key_exists($surface, $allowed[$section])) { continue; }
                $value = $allowed[$section][$surface];
                if ($section === 'theme' && is_string($value)) {
                    $this->configureTheme($companyId, $surface, $value, $actorId, $audit);
                } elseif ($section === 'pages' && is_array($value)) {
                    $this->configurePages($companyId, $surface, $value, $actorId, $audit);
                } elseif (is_array($value)) {
                    match ($section) {
                        'identity' => $this->configureIdentity($companyId, $surface, $value, $actorId, $audit),
                        'features' => $this->configureFeatures($companyId, $surface, $value, $actorId, $audit),
                        'navigation' => $this->configureNavigation($companyId, $surface, $value, $actorId, $audit),
                        'assistant' => $this->configureAssistantPresentation($companyId, $surface, $value, $actorId, $audit),
                        'privacy' => $this->configurePrivacy($companyId, $surface, $value, $actorId, $audit),
                        'notifications' => $this->configureNotifications($companyId, $surface, $value, $actorId, $audit),
                        'offline' => $this->configureOfflinePolicy($companyId, $surface, $value, $actorId, $audit),
                        default => null,
                    };
                }
            }
        }

        $applications = $this->getApplications($companyId);
        $readiness = [];
        foreach (self::SURFACES as $surface) {
            $readiness[$surface] = $this->getReadiness($companyId, $surface);
        }
        return ['applications' => $applications, 'readiness' => $readiness, 'idempotent_key' => 'company:'.$companyId.':titan-applications'];
    }

    public function handoff(int $companyId): array
    {
        $applications = [];
        foreach (self::SURFACES as $surface) {
            $project = $this->project($companyId, $surface, false);
            if (! $project) {
                $applications[$surface] = ['surface' => $surface, 'state' => 'not-configured', 'readiness' => ['status' => 'blocked', 'reasons' => [['code' => 'application.missing']]]];
                continue;
            }
            $draft = $this->draftDefinition($companyId, $project);
            $published = null;
            try { $published = $this->mobile->definition($companyId, (int) $project->getKey(), true); } catch (InvalidArgumentException) { $published = null; }
            $applications[$surface] = [
                'surface' => $surface,
                'product' => (string) ($draft['product'] ?? ''),
                'ready' => (($draft['readiness']['status'] ?? 'blocked') === 'ready'),
                'readiness' => $draft['readiness'],
                'version' => $published['version'] ?? null,
                'publish_snapshot' => $published['publish_snapshot'] ?? null,
                'preview_reference' => ['project_id' => (int) $project->getKey(), 'surface' => $surface],
                'open_capability' => 'mobile.application.open',
                'install_capability' => 'mobile.application.install',
            ];
        }
        return ['schema_version' => 'titan-onboarding-application-handoff/1', 'company_id' => $companyId, 'applications' => $applications];
    }

    public function configureIdentity(int $companyId, string $surface, array $identity, ?string $actorId = null, array $audit = []): array
    {
        $allowed = array_intersect_key($identity, array_flip(['display_name','tagline','logo','icon']));
        return $this->update($companyId, $surface, 'identity', $allowed, $actorId, 'builder.application.configure', $audit);
    }

    public function configureSharedBrand(int $companyId, array $brand, ?string $actorId = null, array $audit = []): array
    {
        $results = [];
        foreach (self::SURFACES as $surface) {
            $project = $this->project($companyId, $surface, true, $actorId, $audit);
            $safe = $this->brandValidator->validate($brand, $companyId, (int) $project->getKey());
            $meta = (array) $project->meta;
            $meta['application']['brand'] = ['inherit' => 'company-brand', 'shared' => $safe, 'overrides' => (array) (($meta['application']['brand'] ?? [])['overrides'] ?? [])];
            $project->forceFill(['meta' => $meta])->save();
            $results[$surface] = $this->draftDefinition($companyId, $project);
            $this->record($companyId, $actorId, 'builder.brand.update', $project, $audit);
        }
        return $results;
    }

    public function configureBrand(int $companyId, string $surface, array $brand, ?string $actorId = null, array $audit = []): array
    {
        $project = $this->project($companyId, $surface, true, $actorId, $audit);
        $safe = $this->brandValidator->validate($brand, $companyId, (int) $project->getKey());
        $meta = (array) $project->meta;
        $current = (array) (($meta['application'] ?? [])['brand'] ?? ['inherit' => 'company-brand', 'overrides' => []]);
        $current['overrides'] = [...(array) ($current['overrides'] ?? []), ...$safe];
        $meta['application']['brand'] = $current;
        $project->forceFill(['meta' => $meta])->save();
        $this->record($companyId, $actorId, 'builder.brand.update', $project, $audit);
        return $this->draftDefinition($companyId, $project);
    }

    public function configureNavigation(int $companyId, string $surface, array $navigation, ?string $actorId = null, array $audit = []): array
    {
        foreach (['primary','drawer'] as $key) {
            if (isset($navigation[$key]) && (! is_array($navigation[$key]) || ! array_is_list($navigation[$key]))) {
                throw new InvalidArgumentException('Navigation lists must be arrays.');
            }
        }
        return $this->update($companyId, $surface, 'navigation', $navigation, $actorId, 'builder.navigation.update', $audit);
    }

    public function configureFeatures(int $companyId, string $surface, array $features, ?string $actorId = null, array $audit = []): array
    {
        $safe = [];
        foreach ($features as $key => $value) {
            if (! is_string($key) || ! preg_match('/^[a-z0-9][a-z0-9._-]{0,79}$/', $key) || ! is_bool($value)) {
                throw new InvalidArgumentException('Feature flags must be boolean values with safe identifiers.');
            }
            $safe[$key] = $value;
        }
        return $this->update($companyId, $surface, 'features', $safe, $actorId, 'builder.features.update', $audit);
    }

    public function configurePages(int $companyId, string $surface, array $pageSlugs, ?string $actorId = null, array $audit = []): array
    {
        $project = $this->project($companyId, $surface, true, $actorId, $audit);
        $available = array_map(static fn ($page): string => (string) $page->slug, $this->pages->pagesForProject($companyId, (int) $project->getKey()));
        $requested = array_values(array_unique(array_filter($pageSlugs, 'is_string')));
        $unknown = array_values(array_diff($requested, $available));
        if ($unknown !== []) { throw new InvalidArgumentException('Pages do not belong to this company application: '.implode(', ', $unknown)); }
        return $this->updateProject($companyId, $project, 'enabled_pages', $requested, $actorId, 'builder.page.configure', $audit);
    }

    public function configureTheme(int $companyId, string $surface, string $theme, ?string $actorId = null, array $audit = []): array
    {
        $project = $this->project($companyId, $surface, true, $actorId, $audit);
        $packaged = $this->registry->find('themes', $theme) !== null;
        $persisted = BuilderTheme::query()->forCompany($companyId)->where(function ($query) use ($project): void {
            $query->whereNull('project_id')->orWhere('project_id', $project->getKey());
        })->where('slug', $theme)->exists();
        if (! $packaged && ! $persisted) { throw new InvalidArgumentException('Theme is not available to this company application.'); }
        return $this->updateProject($companyId, $project, 'theme', $theme, $actorId, 'builder.theme.update', $audit);
    }

    public function configureAssistantPresentation(int $companyId, string $surface, array $assistant, ?string $actorId = null, array $audit = []): array
    {
        $safe = array_intersect_key($assistant, array_flip(['enabled','placement','persistent','suggested_prompts','surface_role_description','chatbot_reference']));
        return $this->update($companyId, $surface, 'assistant', $safe, $actorId, 'builder.application.configure', $audit);
    }

    public function configurePrivacy(int $companyId, string $surface, array $privacy, ?string $actorId = null, array $audit = []): array
    {
        return $this->update($companyId, $surface, 'privacy', $privacy, $actorId, 'builder.application.configure', $audit);
    }

    public function configureNotifications(int $companyId, string $surface, array $notifications, ?string $actorId = null, array $audit = []): array
    {
        return $this->update($companyId, $surface, 'notifications', array_values($notifications), $actorId, 'builder.application.configure', $audit);
    }

    public function configureOfflinePolicy(int $companyId, string $surface, array $offline, ?string $actorId = null, array $audit = []): array
    {
        $surfaceDefinition = $this->registry->find('surfaces', $surface) ?? [];
        $mode = (string) ($offline['mode'] ?? '');
        $declaredConnectivity = (string) ($surfaceDefinition['connectivity'] ?? '');
        if ($surface === 'field' && $mode !== '' && $mode !== 'offline-first') {
            throw new InvalidArgumentException('Titan Go must remain offline-first.');
        }
        if ($surface !== 'field' && $mode === 'offline-first' && $declaredConnectivity !== 'offline-first') {
            throw new InvalidArgumentException('This surface does not advertise an offline-first runtime contract.');
        }
        return $this->update($companyId, $surface, 'offline', $offline, $actorId, 'builder.application.configure', $audit);
    }

    public function applyVerticalPack(int $companyId, string $surface, string $verticalSlug, ?string $actorId = null, array $audit = []): array
    {
        $pack = $this->registry->find('verticals', $verticalSlug);
        if (! $pack) { throw new InvalidArgumentException('Unknown Builder vertical pack.'); }
        if (! in_array($surface, (array) ($pack['surfaces'] ?? []), true)) { throw new InvalidArgumentException('Vertical pack does not support this surface.'); }
        $crm = $this->verticalContext->current($companyId);
        $crmSlug = $crm['vertical_slug'] ?? null;
        if (is_string($crmSlug) && $crmSlug !== '' && $crmSlug !== $verticalSlug) {
            throw new InvalidArgumentException('Requested vertical conflicts with CRM company configuration.');
        }
        $project = $this->project($companyId, $surface, true, $actorId, $audit);
        $meta = (array) $project->meta;
        $app = (array) ($meta['application'] ?? []);
        $app['vertical'] = $verticalSlug;
        $app['vertical_ui_hints'] = (array) ($pack['ui_hints'] ?? []);
        $app['terminology'] = (array) ($pack['terminology'] ?? []);
        $app['data_sources'] = array_values(array_unique([...(array) ($app['data_sources'] ?? []), ...(array) ($pack['data_sources'] ?? [])]));
        $app['action_intents'] = array_values(array_unique([...(array) ($app['action_intents'] ?? []), ...(array) ($pack['action_intents'] ?? [])]));
        $app['crm_capabilities'] = array_values((array) ($crm['capabilities'] ?? []));
        $app['crm_feature_flags'] = (array) ($crm['feature_flags'] ?? []);
        $app['vertical_pending_crm'] = ! is_string($crmSlug) || $crmSlug === '';
        $meta['application'] = $app;
        $project->forceFill(['meta' => $meta])->save();
        $this->record($companyId, $actorId, 'builder.vertical.apply', $project, $audit);
        return $this->draftDefinition($companyId, $project);
    }

    public function preview(int $companyId, string $surface, array $previewContext = []): array
    {
        $project = $this->project($companyId, $surface, true);
        return ['definition' => $this->mobile->definition($companyId, (int) $project->getKey(), false), 'preview' => $this->normalisePreview($surface, $previewContext), 'data_mode' => 'fixture-or-authorized-read-dto'];
    }

    public function validate(int $companyId, string $surface): array
    {
        $project = $this->project($companyId, $surface, true);
        $issues = [];
        foreach ($this->pages->pagesForProject($companyId, (int) $project->getKey()) as $page) {
            $spec = $this->pages->latestSpecForCompany($companyId, (int) $page->getKey());
            if (! $spec) { $issues[] = ['page' => $page->slug, 'message' => 'Page has no draft spec.']; continue; }
            $validation = $this->specValidator->validate((array) $spec->spec);
            if (! $validation['valid']) { $issues[] = ['page' => $page->slug, 'message' => 'Page spec is invalid.', 'issues' => $validation['issues']]; }
        }
        return ['valid' => $issues === [], 'issues' => $issues, 'readiness' => $this->readiness->assess($companyId, $project)];
    }

    public function getReadiness(int $companyId, string $surface): array
    {
        return $this->readiness->assess($companyId, $this->project($companyId, $surface, true));
    }

    public function publish(int $companyId, string $surface, ?string $actorId = null, array $audit = []): array
    {
        $project = $this->project($companyId, $surface, true, $actorId, $audit);
        $validation = $this->validate($companyId, $surface);
        if (! $validation['valid'] || ($validation['readiness']['status'] ?? 'blocked') === 'blocked') {
            throw new InvalidArgumentException('Application is not ready to publish.');
        }
        $snapshot = $this->publisher->publish($companyId, (int) $project->getKey(), $actorId);
        $this->record($companyId, $actorId, 'builder.publish', $project, [...$audit, 'version' => $snapshot->version]);
        return $this->mobile->definition($companyId, (int) $project->getKey(), true);
    }

    public function rollback(int $companyId, string $surface, int $snapshotId, ?string $actorId = null, array $audit = []): array
    {
        $project = $this->project($companyId, $surface, true, $actorId, $audit);
        $snapshot = $this->publisher->rollback($companyId, (int) $project->getKey(), $snapshotId, $actorId);
        $this->record($companyId, $actorId, 'builder.rollback', $project, [...$audit, 'version' => $snapshot->version]);
        return $this->mobile->definition($companyId, (int) $project->getKey(), true);
    }

    public function activate(int $companyId, string $surface, int $snapshotId, ?string $actorId = null, array $audit = []): array
    {
        return $this->rollback($companyId, $surface, $snapshotId, $actorId, $audit);
    }

    private function update(int $companyId, string $surface, string $section, array $value, ?string $actorId, string $action, array $audit): array
    {
        $project = $this->project($companyId, $surface, true, $actorId, $audit);
        return $this->updateProject($companyId, $project, $section, $value, $actorId, $action, $audit);
    }

    private function updateProject(int $companyId, BuilderProject $project, string $section, mixed $value, ?string $actorId, string $action, array $audit): array
    {
        $meta = (array) $project->meta;
        $meta['application'] = (array) ($meta['application'] ?? []);
        $meta['application'][$section] = $value;
        $meta['application']['state'] = 'draft';
        $project->forceFill(['meta' => $meta])->save();
        $this->record($companyId, $actorId, $action, $project, $audit);
        return $this->draftDefinition($companyId, $project);
    }

    private function project(int $companyId, string $surface, bool $create, ?string $actorId = null, array $audit = []): ?BuilderProject
    {
        $this->assertSurface($surface);
        $slug = 'titan-application-'.$surface;
        $project = BuilderProject::query()->forCompany($companyId)->where('slug', $slug)->first();
        if (! $project && $create) {
            $this->createApplication($companyId, $surface, $actorId, $audit);
            $project = BuilderProject::query()->forCompany($companyId)->where('slug', $slug)->first();
        }
        return $project;
    }

    private function draftDefinition(int $companyId, BuilderProject $project): array
    {
        $definition = $this->mobile->definition($companyId, (int) $project->getKey(), false);
        $definition['readiness'] = $this->readiness->assess($companyId, $project);
        return $definition;
    }

    private function seedDefaultPage(int $companyId, BuilderProject $project, array $template, ?string $actorId): void
    {
        $default = (array) ($template['default_page'] ?? []);
        $slug = (string) ($default['slug'] ?? '');
        $specId = (string) ($default['spec'] ?? '');
        if ($slug === '' || $specId === '') { return; }
        $spec = $this->registry->find('specs', $specId);
        if (! $spec) { throw new InvalidArgumentException('Default application page spec is unavailable.'); }
        $page = BuilderPage::query()->forCompany($companyId)
            ->where('project_id', (int) $project->getKey())->where('slug', $slug)->first();
        if (! $page) {
            $page = BuilderPage::query()->create([
                'company_id' => $companyId,
                'project_id' => (int) $project->getKey(),
                'slug' => $slug,
                'name' => (string) ($default['name'] ?? $spec['name'] ?? $slug),
                'sort_order' => 0,
                'meta' => ['provisioned_from' => $specId],
            ]);
        }
        if (! $this->pages->latestSpecForCompany($companyId, (int) $page->getKey())) {
            $this->pages->saveDraftSpec($companyId, (int) $page->getKey(), $spec, $actorId);
        }
    }

    private function assertSurface(string $surface): void
    {
        if (! in_array($surface, self::SURFACES, true)) { throw new InvalidArgumentException('Unknown Titan application surface.'); }
    }

    private function normalisePreview(string $surface, array $context): array
    {
        $surfaceDefinition = $this->registry->find('surfaces', $surface) ?? [];
        $device = (string) ($context['device'] ?? 'mobile');
        $state = (string) ($context['state'] ?? 'online');
        if (! in_array($device, (array) ($surfaceDefinition['allowed_devices'] ?? []), true)) { $device = 'mobile'; }
        if (! in_array($state, (array) ($surfaceDefinition['preview_states'] ?? []), true)) { $state = 'online'; }
        return ['device' => $device, 'state' => $state, 'fixture' => true, 'live_business_mutations' => false];
    }

    private function record(int $companyId, ?string $actorId, string $action, BuilderProject $project, array $audit): void
    {
        $this->auditLogger->record($companyId, $actorId, $action, [...$audit, 'project' => (int) $project->getKey(), 'application_surface' => (string) $project->surface]);
    }
}
