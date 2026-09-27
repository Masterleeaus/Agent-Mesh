<?php

declare(strict_types=1);

namespace App\Extensions\InteractionEngine\System\Wizard\Offline;

final class InMemoryWizardOutboxStore implements WizardOutboxStoreInterface
{
    /** @var array<string,array<string,array<string,mixed>>> */
    private array $items = [];

    public function put(string $companyId, array $envelope): void
    {
        $this->items[$companyId][(string) $envelope['id']] = $envelope;
    }

    public function pending(string $companyId): array
    {
        return array_values(array_filter(
            $this->items[$companyId] ?? [],
            static fn(array $item): bool => ($item['status'] ?? null) === 'pending'
        ));
    }

    public function markSynced(string $companyId, string $id): void
    {
        if (!isset($this->items[$companyId][$id])) return;
        $this->items[$companyId][$id]['status'] = 'synced';
        $this->items[$companyId][$id]['synced_at'] = gmdate(DATE_ATOM);
    }
}
