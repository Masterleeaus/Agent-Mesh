<?php
declare(strict_types=1);

namespace App\Extensions\TitanAppsCore\System\Contracts;

interface SuiteProductionGate
{
    /** @param array<string,array<string,mixed>> $extensions @return array<string,mixed> */
    public function evaluate(array $extensions): array;
    /** @return array<string,array<string,mixed>> */
    public function requirements(): array;
}
