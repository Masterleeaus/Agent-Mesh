<?php

declare(strict_types=1);

namespace App\Extensions\TitanBuilder\System\Contracts;

interface MobileApplicationDefinitionPublisher
{
    /** @return array<string,mixed> */
    public function definition(int $companyId, int $projectId, bool $publishedOnly = true): array;
}
