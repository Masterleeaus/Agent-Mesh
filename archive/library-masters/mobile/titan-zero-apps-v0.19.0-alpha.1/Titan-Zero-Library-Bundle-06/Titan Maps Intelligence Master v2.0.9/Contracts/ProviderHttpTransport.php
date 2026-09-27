<?php

declare(strict_types=1);

namespace App\Extensions\TitanMapsIntelligence\Contracts;

interface ProviderHttpTransport
{
    public function request(
        string $method,
        string $url,
        array $headers = [],
        array $json = [],
        int $timeoutSeconds = 10,
        int $retryAttempts = 2,
    ): array;
}
