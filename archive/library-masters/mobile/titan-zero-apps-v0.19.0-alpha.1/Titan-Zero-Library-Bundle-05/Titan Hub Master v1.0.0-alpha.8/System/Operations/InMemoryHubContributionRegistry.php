<?php

declare(strict_types=1);
namespace App\Extensions\TitanHub\System\Operations;

use App\Extensions\TitanHub\System\Contracts\CustomerOperationsContributor;
use App\Extensions\TitanHub\System\Contracts\HubContributionRegistry;

final class InMemoryHubContributionRegistry implements HubContributionRegistry
{
    /** @var list<CustomerOperationsContributor> */
    private array $contributors=[];

    public function register(CustomerOperationsContributor $contributor): void
    {
        foreach ($this->contributors as $existing) {
            if ($existing === $contributor) return;
        }
        $this->contributors[]=$contributor;
    }

    public function contributors(string $operation): array
    {
        return array_values(array_filter($this->contributors, static fn(CustomerOperationsContributor $c): bool => in_array($operation, $c->supports(), true)));
    }
}
