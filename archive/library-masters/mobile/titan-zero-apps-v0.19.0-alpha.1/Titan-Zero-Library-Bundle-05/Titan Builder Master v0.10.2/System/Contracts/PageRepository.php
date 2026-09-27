<?php
namespace App\Extensions\TitanBuilder\System\Contracts;
use App\Extensions\TitanBuilder\System\Models\BuilderPage;
use App\Extensions\TitanBuilder\System\Models\BuilderPageSpec;
interface PageRepository {
    public function findPageForCompany(int $companyId, int $pageId): ?BuilderPage;
    public function latestSpecForCompany(int $companyId, int $pageId): ?BuilderPageSpec;
    public function pagesForProject(int $companyId, int $projectId): array;
    public function saveDraftSpec(int $companyId, int $pageId, array $spec, ?string $actorId = null): BuilderPageSpec;
}
