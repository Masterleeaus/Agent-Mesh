<?php
declare(strict_types=1);
namespace App\Extensions\TitanMcp\System\Workforce;

interface ProviderHealthStoreContract
{
    public function put(ProviderHealthSnapshot $snapshot): void;
    public function get(int|string $companyId, string $providerKey, int $now): ?ProviderHealthSnapshot;
}
