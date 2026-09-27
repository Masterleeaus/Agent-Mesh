<?php
declare(strict_types=1);
namespace App\Extensions\TitanMcp\System\Workforce;

interface ProviderHealthProbeContract
{
    public function probe(int|string $companyId, int $now): ProviderHealthSnapshot;
}
