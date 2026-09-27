<?php

declare(strict_types=1);

namespace App\Extensions\TitanBuilder\System\Repositories;

use App\Extensions\TitanBuilder\System\Assets\AssetReferenceGuard;
use App\Extensions\TitanBuilder\System\Contracts\PageRepository;
use App\Extensions\TitanBuilder\System\GenerativeUI\GenerativeUiSpecValidator;
use App\Extensions\TitanBuilder\System\Models\BuilderPage;
use App\Extensions\TitanBuilder\System\Models\BuilderPageSpec;
use App\Extensions\TitanBuilder\System\Support\CanonicalJson;
use InvalidArgumentException;

final class EloquentPageRepository implements PageRepository
{
    public function __construct(
        private readonly GenerativeUiSpecValidator $validator,
        private readonly AssetReferenceGuard $assets,
    ) {}

    public function findPageForCompany(int $companyId, int $pageId): ?BuilderPage
    {
        return BuilderPage::query()->forCompany($companyId)->whereKey($pageId)->first();
    }

    public function latestSpecForCompany(int $companyId, int $pageId): ?BuilderPageSpec
    {
        return BuilderPageSpec::query()->forCompany($companyId)->where('page_id', $pageId)->latest('id')->first();
    }

    public function pagesForProject(int $companyId, int $projectId): array
    {
        return BuilderPage::query()->forCompany($companyId)->where('project_id', $projectId)->orderBy('sort_order')->orderBy('id')->get()->all();
    }

    public function saveDraftSpec(int $companyId, int $pageId, array $spec, ?string $actorId = null): BuilderPageSpec
    {
        $page = $this->findPageForCompany($companyId, $pageId);
        if (! $page) {
            throw new InvalidArgumentException('Page was not found in the current company.');
        }
        $validation = $this->validator->validate($spec);
        if (! $validation['valid']) {
            throw new InvalidArgumentException('Page spec failed validation: '.json_encode($validation['issues'], JSON_UNESCAPED_SLASHES));
        }
        $safe = $validation['spec'];
        $this->assets->assertSpecReferences($safe, $companyId, (int) $page->project_id);
        return BuilderPageSpec::query()->create([
            'company_id' => $companyId,
            'page_id' => $page->getKey(),
            'schema_version' => (string) ($safe['version'] ?? '1.1'),
            'surface' => (string) ($safe['surface'] ?? 'page'),
            'spec' => $safe,
            'checksum' => CanonicalJson::checksum($safe),
            'created_by' => $actorId,
        ]);
    }
}
