<?php

declare(strict_types=1);

namespace App\Extensions\InteractionEngine\System\Wizard\Offline;


final class DatabaseWizardOutboxStore implements WizardOutboxStoreInterface
{
    private const TABLE = 'interaction_wizard_outbox';

    public function put(string $companyId, array $envelope): void
    {
        $companyId = $this->company($companyId);
        $id = trim((string) ($envelope['id'] ?? ''));
        if ($id === '') throw new \InvalidArgumentException('Wizard outbox envelope id is required.');

        app('db')->table(self::TABLE)->updateOrInsert(
            ['company_id' => $companyId, 'id' => $id],
            [
                'status' => (string) ($envelope['status'] ?? 'pending'),
                'envelope' => json_encode($envelope, JSON_THROW_ON_ERROR | JSON_UNESCAPED_SLASHES),
                'updated_at' => now(),
                'created_at' => now(),
            ]
        );
    }

    public function pending(string $companyId): array
    {
        $rows = app('db')->table(self::TABLE)
            ->where('company_id', $this->company($companyId))
            ->where('status', 'pending')
            ->orderBy('created_at')
            ->get(['envelope']);

        $items = [];
        foreach ($rows as $row) {
            $decoded = json_decode((string) $row->envelope, true);
            if (is_array($decoded)) $items[] = $decoded;
        }
        return $items;
    }

    public function markSynced(string $companyId, string $id): void
    {
        app('db')->table(self::TABLE)
            ->where('company_id', $this->company($companyId))
            ->where('id', $id)
            ->update(['status' => 'synced', 'synced_at' => now(), 'updated_at' => now()]);
    }

    private function company(string $companyId): string
    {
        $companyId = trim($companyId);
        if ($companyId === '') throw new \InvalidArgumentException('Wizard outbox operations require company_id.');
        return $companyId;
    }
}
