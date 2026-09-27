<?php

declare(strict_types=1);
namespace App\Extensions\InteractionEngine\System\Capabilities\Contracts;
use App\Extensions\InteractionEngine\System\Capabilities\CapabilityExecutionContext;
interface CrmReadModelGatewayInterface
{
    public function customer(string $id, CapabilityExecutionContext $context): ?array;
    public function searchCustomers(string $query, CapabilityExecutionContext $context, int $limit=5): array;
    public function services(string $query, CapabilityExecutionContext $context, int $limit=20): array;
    public function workOrders(array $filters, CapabilityExecutionContext $context, int $limit=100): array;
}
