<?php

declare(strict_types=1);

namespace App\Extensions\TitanMapsIntelligence\Contracts;

interface AdminPermissionAuthorizer
{
    public function authorize(mixed $user, string $permission): void;
}
