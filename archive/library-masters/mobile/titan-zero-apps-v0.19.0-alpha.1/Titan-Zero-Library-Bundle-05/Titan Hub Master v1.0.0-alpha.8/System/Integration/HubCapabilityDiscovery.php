<?php

declare(strict_types=1);

namespace App\Extensions\TitanHub\System\Integration;

use App\Extensions\TitanHub\System\Contracts\HubContributionRegistry;

/**
 * Derives customer-facing availability from registered provider contributions.
 * It exposes presence only; providers remain the authority for all reads/writes.
 */
final class HubCapabilityDiscovery
{
    public function __construct(private HubContributionRegistry $registry) {}

    /** @return array<string,mixed> */
    public function report(): array
    {
        $has = fn(string $operation): bool => $this->registry->contributors($operation) !== [];

        $reads = [
            'hub.home.read' => $has('home.summary') || $has('jobs.list') || $has('bookings.list') || $has('quotes.list') || $has('invoices.list'),
            'hub.services.read' => $has('services.list'),
            'hub.jobs.read' => $has('jobs.list'),
            'hub.bookings.read' => $has('bookings.list'),
            'hub.quotes.read' => $has('quotes.list'),
            'hub.invoices.read' => $has('invoices.list'),
            'hub.documents.read' => $has('documents.list'),
            'hub.profile.read' => $has('profile.read'),
            'hub.inbox.read' => $has('support.list'),
        ];

        $actions = [
            'hub.service-request.create' => count($this->registry->contributors('service_requests.create')) === 1,
            'hub.booking-change.request' => count($this->registry->contributors('bookings.request_change')) === 1,
            'hub.quote.approve' => count($this->registry->contributors('quotes.approve')) === 1,
        ];

        return [
            'surface' => 'hub',
            'reads' => $reads,
            'actions' => $actions,
            'workspaces' => [
                'home' => ['available' => $reads['hub.home.read']],
                'book' => ['available' => $reads['hub.services.read'] && $actions['hub.service-request.create']],
                'inbox' => ['available' => $reads['hub.inbox.read']],
                'more' => ['available' => $reads['hub.profile.read']],
            ],
        ];
    }
}
