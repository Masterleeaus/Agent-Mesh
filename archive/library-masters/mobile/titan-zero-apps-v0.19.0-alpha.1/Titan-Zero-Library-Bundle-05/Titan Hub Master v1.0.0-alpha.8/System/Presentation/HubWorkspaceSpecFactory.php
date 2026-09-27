<?php

declare(strict_types=1);

namespace App\Extensions\TitanHub\System\Presentation;

/**
 * Builds semantic, Builder-catalogue-compatible Hub presentation specs.
 * Domain projections are already customer-safe before they reach this class.
 */
final class HubWorkspaceSpecFactory
{
    /** @return array<string,mixed> */
    public function build(string $workspace, array $projection): array
    {
        $workspace = strtolower(trim($workspace));
        $children = match ($workspace) {
            'home' => $this->home($projection),
            'book' => $this->book($projection),
            'inbox' => $this->inbox($projection),
            'more' => $this->more($projection),
            default => [[
                'component' => 'empty-state',
                'props' => ['title' => 'Workspace unavailable', 'message' => 'This Hub workspace is not registered.'],
            ]],
        };

        return [
            'component' => 'mobile-app-shell',
            'props' => [
                'surface' => 'hub',
                'workspace' => $workspace,
                'navigation' => ['home', 'book', 'inbox', 'more'],
                'actions_as_intents' => true,
            ],
            'accessibility' => ['landmark' => 'main', 'label' => 'Titan Hub'],
            'visual' => [
                'visualTreatment' => 'hub.'.$workspace,
                'motionPreset' => 'reduced-motion-aware',
                'transitionPreset' => 'workspace-crossfade',
            ],
            'children' => $children,
        ];
    }

    /** @return list<array<string,mixed>> */
    private function home(array $projection): array
    {
        $jobs = $this->items($projection, 'jobs');
        $bookings = $this->items($projection, 'bookings');
        $quotes = $this->items($projection, 'quotes');
        $invoices = $this->items($projection, 'invoices');

        $summary = is_array($projection['summary'] ?? null) ? $projection['summary'] : [];
        $title = (string)($projection['greeting'] ?? $summary['greeting'] ?? 'Welcome to Titan Hub');
        $subtitle = $projection['summary'] ?? null;
        if (is_array($subtitle)) $subtitle = $subtitle['summary'] ?? $subtitle['message'] ?? null;
        if (!is_scalar($subtitle) || trim((string)$subtitle) === '') $subtitle = 'Your services, bookings and account in one place.';

        return [
            ['component' => 'summary-banner', 'props' => [
                'title' => $title,
                'subtitle' => (string)$subtitle,
            ]],
            ['component' => 'data-list', 'props' => ['title' => 'Upcoming work', 'items' => $jobs, 'empty_message' => 'No upcoming work.']],
            ['component' => 'data-list', 'props' => ['title' => 'Bookings', 'items' => $bookings, 'empty_message' => 'No bookings scheduled.']],
            ['component' => 'data-list', 'props' => ['title' => 'Quotes', 'items' => $quotes, 'empty_message' => 'No quotes waiting.']],
            ['component' => 'data-list', 'props' => ['title' => 'Invoices', 'items' => $invoices, 'empty_message' => 'No invoices to show.']],
        ];
    }

    /** @return list<array<string,mixed>> */
    private function book(array $projection): array
    {
        $services = array_is_list($projection) ? $projection : $this->items($projection, 'services');
        $children = [
            ['component' => 'summary-banner', 'props' => ['title' => 'Book a service', 'subtitle' => 'Choose a service and send a governed booking request.']],
            ['component' => 'data-list', 'props' => ['title' => 'Services', 'items' => $services, 'empty_message' => 'No services are currently available.']],
        ];
        $actions = $projection['_hub']['actions'] ?? null;
        if (!is_array($actions) || ($actions['hub.service-request.create'] ?? false) === true) {
            $children[] = ['component' => 'action-bar', 'props' => ['actions' => [[
                'label' => 'Request service',
                'intent' => 'hub.service-request.create',
                'destructive' => false,
            ]]]];
        }
        return $children;
    }

    /** @return list<array<string,mixed>> */
    private function inbox(array $projection): array
    {
        $threads = array_is_list($projection) ? $projection : $this->items($projection, 'threads', $this->items($projection, 'support'));
        return [
            ['component' => 'summary-banner', 'props' => ['title' => 'Inbox', 'subtitle' => 'Messages and service updates.']],
            ['component' => 'chat-thread', 'props' => ['items' => $threads, 'empty_message' => 'No messages yet.']],
        ];
    }

    /** @return list<array<string,mixed>> */
    private function more(array $projection): array
    {
        return [
            ['component' => 'summary-banner', 'props' => ['title' => 'Account', 'subtitle' => 'Customer-safe profile and account details.']],
            ['component' => 'key-value-list', 'props' => ['items' => $this->keyValues($projection)]],
        ];
    }

    /** @return list<mixed> */
    private function items(array $projection, string $key, array $fallback = []): array
    {
        $items = $projection[$key] ?? $fallback;
        return is_array($items) ? (array_is_list($items) ? $items : [$items]) : $fallback;
    }

    /** @return list<array{label:string,value:mixed}> */
    private function keyValues(array $projection): array
    {
        $items = [];
        foreach ($projection as $key => $value) {
            if (is_scalar($value) || $value === null) {
                $items[] = ['label' => ucwords(str_replace('_', ' ', (string)$key)), 'value' => $value];
            }
        }
        return $items;
    }
}
