<?php

declare(strict_types=1);

namespace App\Extensions\TitanBuilder\System\Contracts;

/** Builder-facing CRM 1.2 contract. Implemented outside Titan Builder. */
interface CrmBusinessConfigurationGateway
{
    /** @return array{vertical_slug:?string,capabilities:list<string>,services:list<array<string,mixed>>,feature_flags:array<string,bool>} */
    public function configuration(int $companyId): array;
}
