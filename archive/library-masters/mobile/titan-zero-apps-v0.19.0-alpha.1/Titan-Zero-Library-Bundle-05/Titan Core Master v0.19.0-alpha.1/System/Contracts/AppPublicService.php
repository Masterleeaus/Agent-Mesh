<?php
declare(strict_types=1);

namespace App\Extensions\TitanAppsCore\System\Contracts;

interface AppPublicService
{
    public function id(): string;
    public function owner(): string;
    public function platformAccessible(): bool;

    /** @return list<string> */
    public function contractCandidates(): array;
}
