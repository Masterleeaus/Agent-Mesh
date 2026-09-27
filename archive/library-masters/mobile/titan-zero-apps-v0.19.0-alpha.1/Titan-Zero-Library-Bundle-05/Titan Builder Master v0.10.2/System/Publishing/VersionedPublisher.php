<?php

declare(strict_types=1);

namespace App\Extensions\TitanBuilder\System\Publishing;

use App\Extensions\TitanBuilder\System\Contracts\PageRepository;
use App\Extensions\TitanBuilder\System\Contracts\Publisher;
use App\Extensions\TitanBuilder\System\GenerativeUI\GenerativeUiSpecValidator;
use App\Extensions\TitanBuilder\System\Models\BuilderAsset;
use App\Extensions\TitanBuilder\System\Models\BuilderProject;
use App\Extensions\TitanBuilder\System\Models\BuilderTemplate;
use App\Extensions\TitanBuilder\System\Models\BuilderTheme;
use App\Extensions\TitanBuilder\System\Models\BuilderVersion;
use App\Extensions\TitanBuilder\System\Models\PublishSnapshot;
use App\Extensions\TitanBuilder\System\Support\CanonicalJson;
use Illuminate\Support\Facades\DB;
use InvalidArgumentException;

final class VersionedPublisher implements Publisher
{
    public function __construct(
        private readonly PageRepository $pages,
        private readonly GenerativeUiSpecValidator $validator,
    ) {}

    public function publish(int $companyId, int $projectId, ?string $actorId = null): PublishSnapshot
    {
        return DB::transaction(function () use ($companyId, $projectId, $actorId): PublishSnapshot {
            $project = BuilderProject::query()->forCompany($companyId)->whereKey($projectId)->lockForUpdate()->first();
            if (! $project) {
                throw new InvalidArgumentException('Project was not found in the current company.');
            }

            $pages = $this->pages->pagesForProject($companyId, $projectId);
            if ($pages === []) {
                throw new InvalidArgumentException('A project must contain at least one page before publishing.');
            }

            $pagePayloads = [];
            foreach ($pages as $page) {
                $pageSpec = $this->pages->latestSpecForCompany($companyId, (int) $page->getKey());
                if (! $pageSpec) {
                    throw new InvalidArgumentException("Page {$page->slug} has no validated draft spec.");
                }
                $validation = $this->validator->validate((array) $pageSpec->spec);
                if (! $validation['valid']) {
                    throw new InvalidArgumentException("Page {$page->slug} failed publish validation.");
                }
                $pagePayloads[] = [
                    'page_id' => (int) $page->getKey(),
                    'slug' => (string) $page->slug,
                    'name' => (string) $page->name,
                    'spec_checksum' => (string) $pageSpec->checksum,
                    'spec' => $validation['spec'],
                ];
            }

            $current = (int) (BuilderVersion::query()->forCompany($companyId)->where('project_id', $projectId)->max('version') ?? 0);
            $nextVersion = $current + 1;
            $publishedAt = now();
            $snapshotPayload = [
                'schema' => 'titan-builder-publish-snapshot/1',
                'company_id' => $companyId,
                'project' => [
                    'id' => (int) $project->getKey(),
                    'slug' => (string) $project->slug,
                    'name' => (string) $project->name,
                    'surface' => (string) $project->surface,
                    'meta' => (array) ($project->meta ?? []),
                ],
                'version' => $nextVersion,
                'pages' => $pagePayloads,
                'themes' => BuilderTheme::query()->forCompany($companyId)->where('project_id', $projectId)->orderBy('id')->get(['slug', 'name', 'tokens', 'is_default'])->toArray(),
                'templates' => BuilderTemplate::query()->forCompany($companyId)->where('project_id', $projectId)->orderBy('id')->get(['slug', 'name', 'surface', 'definition'])->toArray(),
                'assets' => BuilderAsset::query()->forCompany($companyId)->where('project_id', $projectId)->orderBy('id')->get(['id', 'disk', 'path', 'mime_type', 'size_bytes', 'checksum'])->toArray(),
            ];

            BuilderVersion::query()->create([
                'company_id' => $companyId,
                'project_id' => $projectId,
                'version' => $nextVersion,
                'status' => 'published',
                'created_by' => $actorId,
                'published_at' => $publishedAt,
                'meta' => ['snapshot_schema' => 'titan-builder-publish-snapshot/1'],
            ]);

            $snapshot = PublishSnapshot::query()->create([
                'company_id' => $companyId,
                'project_id' => $projectId,
                'version' => $nextVersion,
                'snapshot' => $snapshotPayload,
                'checksum' => CanonicalJson::checksum($snapshotPayload),
                'created_by' => $actorId,
                'published_at' => $publishedAt,
            ]);

            $project->forceFill(['active_publish_snapshot_id' => $snapshot->getKey()])->save();
            return $snapshot;
        });
    }

    public function rollback(int $companyId, int $projectId, int $snapshotId, ?string $actorId = null): PublishSnapshot
    {
        return DB::transaction(function () use ($companyId, $projectId, $snapshotId): PublishSnapshot {
            $project = BuilderProject::query()->forCompany($companyId)->whereKey($projectId)->lockForUpdate()->first();
            if (! $project) {
                throw new InvalidArgumentException('Project was not found in the current company.');
            }
            $snapshot = PublishSnapshot::query()->forCompany($companyId)->where('project_id', $projectId)->whereKey($snapshotId)->first();
            if (! $snapshot) {
                throw new InvalidArgumentException('Publish snapshot was not found in the current company/project.');
            }
            $project->forceFill(['active_publish_snapshot_id' => $snapshot->getKey()])->save();
            return $snapshot;
        });
    }
}
