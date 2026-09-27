<?php

declare(strict_types=1);
namespace App\Extensions\TitanHub\System\Contracts;

interface HubContributionRegistry
{
    public function register(CustomerOperationsContributor $contributor): void;
    /** @return list<CustomerOperationsContributor> */
    public function contributors(string $operation): array;
}
