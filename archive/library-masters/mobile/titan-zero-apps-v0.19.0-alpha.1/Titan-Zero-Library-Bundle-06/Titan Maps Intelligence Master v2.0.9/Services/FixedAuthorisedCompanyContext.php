<?php

declare(strict_types=1);

namespace App\Extensions\TitanMapsIntelligence\Services;

use App\Extensions\TitanMapsIntelligence\Contracts\AuthorisedCompanyContext;

final class FixedAuthorisedCompanyContext implements AuthorisedCompanyContext
{
    public function __construct(
        private readonly string $companyId,
        private readonly string $userId,
        private readonly ?string $branchId = null,
        private readonly ?string $workspaceId = null,
    ) {}

    public function companyId(): string { return $this->companyId; }
    public function userId(): string { return $this->userId; }
    public function branchId(): ?string { return $this->branchId; }
    public function workspaceId(): ?string { return $this->workspaceId; }
}
