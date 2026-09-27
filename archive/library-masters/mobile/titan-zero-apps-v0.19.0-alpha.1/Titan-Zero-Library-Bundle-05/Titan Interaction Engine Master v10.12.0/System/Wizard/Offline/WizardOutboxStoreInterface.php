<?php

declare(strict_types=1);

namespace App\Extensions\InteractionEngine\System\Wizard\Offline;

interface WizardOutboxStoreInterface
{
    public function put(string $companyId, array $envelope): void;
    /** @return list<array<string,mixed>> */
    public function pending(string $companyId): array;
    public function markSynced(string $companyId, string $id): void;
}
