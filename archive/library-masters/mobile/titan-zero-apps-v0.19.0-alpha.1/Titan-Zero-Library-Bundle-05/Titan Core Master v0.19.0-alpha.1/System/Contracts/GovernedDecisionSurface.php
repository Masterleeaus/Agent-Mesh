<?php
declare(strict_types=1);
namespace App\Extensions\TitanAppsCore\System\Contracts;

interface GovernedDecisionSurface
{
    /** @return array<string,mixed> */
    public function policy(): array;
}
