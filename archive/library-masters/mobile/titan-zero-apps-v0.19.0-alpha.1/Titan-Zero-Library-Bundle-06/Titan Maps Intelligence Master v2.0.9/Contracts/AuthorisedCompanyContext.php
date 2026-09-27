<?php

declare(strict_types=1);

namespace App\Extensions\TitanMapsIntelligence\Contracts;

interface AuthorisedCompanyContext
{
    public function companyId(): string;
    public function userId(): string;
    public function branchId(): ?string;
    public function workspaceId(): ?string;
}
