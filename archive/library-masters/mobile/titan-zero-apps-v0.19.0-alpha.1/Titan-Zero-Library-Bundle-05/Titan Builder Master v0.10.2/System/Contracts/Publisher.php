<?php
namespace App\Extensions\TitanBuilder\System\Contracts;
use App\Extensions\TitanBuilder\System\Models\PublishSnapshot;
interface Publisher {
    public function publish(int $companyId, int $projectId, ?string $actorId = null): PublishSnapshot;
    public function rollback(int $companyId, int $projectId, int $snapshotId, ?string $actorId = null): PublishSnapshot;
}
