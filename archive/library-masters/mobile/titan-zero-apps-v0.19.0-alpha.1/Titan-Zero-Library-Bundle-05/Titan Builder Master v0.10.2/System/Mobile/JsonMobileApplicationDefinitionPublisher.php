<?php

declare(strict_types=1);

namespace App\Extensions\TitanBuilder\System\Mobile;

use App\Extensions\TitanBuilder\System\Contracts\ActionCatalog;
use App\Extensions\TitanBuilder\System\Contracts\CapabilityDiscovery;
use App\Extensions\TitanBuilder\System\Contracts\DataSourceCatalog;
use App\Extensions\TitanBuilder\System\Contracts\MobileApplicationDefinitionPublisher;
use App\Extensions\TitanBuilder\System\Contracts\PageRepository;
use App\Extensions\TitanBuilder\System\Models\BuilderProject;
use App\Extensions\TitanBuilder\System\Models\PublishSnapshot;
use App\Extensions\TitanBuilder\System\Provisioning\TitanApplicationDefinition;
use InvalidArgumentException;

/** Produces a stable DTO/JSON contract for Titan Mobile; no Builder models escape this boundary. */
final class JsonMobileApplicationDefinitionPublisher implements MobileApplicationDefinitionPublisher
{
    public function __construct(
        private readonly PageRepository $pages,
        private readonly ActionCatalog $actions,
        private readonly DataSourceCatalog $dataSources,
        private readonly CapabilityDiscovery $capabilities,
    ) {}

    public function definition(int $companyId, int $projectId, bool $publishedOnly = true): array
    {
        $project = BuilderProject::query()->forCompany($companyId)->whereKey($projectId)->first();
        if (! $project) { throw new InvalidArgumentException('Application project was not found in the current company.'); }
        $meta = (array) ($project->meta ?? []);
        $app = (array) ($meta['application'] ?? []);
        $snapshot = null;
        if ($publishedOnly && $project->active_publish_snapshot_id) {
            $snapshot = PublishSnapshot::query()->forCompany($companyId)->where('project_id', $projectId)->whereKey((int) $project->active_publish_snapshot_id)->first();
        }
        if ($publishedOnly && ! $snapshot) { throw new InvalidArgumentException('Application has no active published snapshot.'); }

        $pages = [];
        if ($snapshot) {
            $snapshotPayload = (array) ($snapshot->snapshot ?? []);
            $snapshotProject = (array) ($snapshotPayload['project'] ?? []);
            $snapshotMeta = (array) ($snapshotProject['meta'] ?? []);
            $snapshotApplication = (array) ($snapshotMeta['application'] ?? []);
            if ($snapshotApplication !== []) { $app = $snapshotApplication; }
            $pages = array_values((array) ($snapshotPayload['pages'] ?? []));
        } elseif (! $publishedOnly) {
            foreach ($this->pages->pagesForProject($companyId, $projectId) as $page) {
                $latest = $this->pages->latestSpecForCompany($companyId, (int) $page->getKey());
                $pages[] = ['slug' => (string) $page->slug, 'name' => (string) $page->name, 'spec' => $latest?->spec];
            }
        }

        [$availableActions, $unavailableActions] = $this->filterActions((array) ($app['action_intents'] ?? []), $companyId, (string) ($app['surface'] ?? $project->surface));
        [$availableSources, $unavailableSources] = $this->filterDataSources((array) ($app['data_sources'] ?? []), $companyId, (string) ($app['surface'] ?? $project->surface));

        $payload = [
            'schema_version' => TitanApplicationDefinition::SCHEMA,
            'company_id' => $companyId,
            'project_id' => (int) $project->getKey(),
            'surface' => (string) ($app['surface'] ?? $project->surface),
            'product' => (string) ($app['product'] ?? ''),
            'vertical' => $app['vertical'] ?? null,
            'identity' => (array) ($app['identity'] ?? []),
            'brand' => (array) ($app['brand'] ?? []),
            'navigation' => (array) ($app['navigation'] ?? []),
            'pages' => $pages,
            'enabled_pages' => array_values((array) ($app['enabled_pages'] ?? [])),
            'features' => (array) ($app['features'] ?? []),
            'assistant' => (array) ($app['assistant'] ?? []),
            'data_sources' => $availableSources,
            'unavailable_data_sources' => $unavailableSources,
            'action_intents' => $availableActions,
            'unavailable_action_intents' => $unavailableActions,
            'offline' => (array) ($app['offline'] ?? []),
            'notifications' => array_values((array) ($app['notifications'] ?? [])),
            'privacy' => (array) ($app['privacy'] ?? []),
            'settings' => (array) ($app['settings'] ?? []),
            'version' => $snapshot ? (int) $snapshot->version : null,
            'publish_snapshot' => $snapshot ? (int) $snapshot->getKey() : null,
            'published_at' => $snapshot?->published_at?->toISOString(),
            'activation_state' => $snapshot ? 'active' : 'draft',
            'runtime_owner' => 'Titan Mobile',
            'credentials' => null,
        ];
        return TitanApplicationDefinition::fromArray($payload)->toArray();
    }

    private function filterActions(array $ids, int $companyId, string $surface): array
    {
        $available = []; $unavailable = [];
        foreach (array_values(array_unique(array_filter($ids, 'is_string'))) as $id) {
            $definition = $this->actions->find($id);
            if (! $definition) { $unavailable[] = ['id' => $id, 'reason' => 'unknown']; continue; }
            $compatible = array_values((array) ($definition['surface_compatibility'] ?? []));
            if ($compatible !== [] && ! in_array($surface, $compatible, true)) {
                $unavailable[] = ['id' => $id, 'reason' => 'surface-incompatible'];
                continue;
            }
            $required = $definition['required_capability'] ?? null;
            if (is_string($required) && $required !== '' && ! $this->capabilities->has($required, $companyId)) {
                $unavailable[] = ['id' => $id, 'reason' => 'capability-missing', 'required_capability' => $required];
                continue;
            }
            $available[] = $id;
        }
        return [$available, $unavailable];
    }

    private function filterDataSources(array $ids, int $companyId, string $surface): array
    {
        $available = []; $unavailable = [];
        foreach (array_values(array_unique(array_filter($ids, 'is_string'))) as $id) {
            $definition = $this->dataSources->find($id);
            if (! $definition) { $unavailable[] = ['id' => $id, 'reason' => 'unknown']; continue; }
            $compatible = array_values((array) ($definition['surface_compatibility'] ?? []));
            if ($compatible !== [] && ! in_array($surface, $compatible, true)) {
                $unavailable[] = ['id' => $id, 'reason' => 'surface-incompatible'];
                continue;
            }
            $required = $definition['required_capability'] ?? null;
            if (is_string($required) && $required !== '' && ! $this->capabilities->has($required, $companyId)) {
                $unavailable[] = ['id' => $id, 'reason' => 'capability-missing', 'required_capability' => $required];
                continue;
            }
            $available[] = $id;
        }
        return [$available, $unavailable];
    }
}
