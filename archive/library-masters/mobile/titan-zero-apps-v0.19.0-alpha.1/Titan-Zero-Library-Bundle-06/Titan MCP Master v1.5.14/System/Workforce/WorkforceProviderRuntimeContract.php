<?php
declare(strict_types=1);
namespace App\Extensions\TitanMcp\System\Workforce;

interface WorkforceProviderRuntimeContract
{
    public function providerKey(): string;
    public function companyScopeKey(): string;
    /** @return list<string> */
    public function capabilities(): array;
    public function supports(string $capability): bool;
}
