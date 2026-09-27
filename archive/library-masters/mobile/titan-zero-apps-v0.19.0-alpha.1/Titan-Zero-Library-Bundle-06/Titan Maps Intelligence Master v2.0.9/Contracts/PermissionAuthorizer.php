<?php

declare(strict_types=1);

namespace App\Extensions\TitanMapsIntelligence\Contracts;

interface PermissionAuthorizer
{
    public function authorize(string $userId, string $companyId, string $permission, array $context = []): void;
}
