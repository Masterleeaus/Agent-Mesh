<?php

declare(strict_types=1);

namespace App\Extensions\TitanMapsIntelligence\Contracts;

interface SecretResolver
{
    public function resolve(string $credentialReference): string;
}
