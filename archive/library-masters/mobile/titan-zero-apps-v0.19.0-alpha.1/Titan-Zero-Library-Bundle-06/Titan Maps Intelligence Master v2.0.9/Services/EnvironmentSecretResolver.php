<?php

declare(strict_types=1);

namespace App\Extensions\TitanMapsIntelligence\Services;

use App\Extensions\TitanMapsIntelligence\Contracts\SecretResolver;
use App\Extensions\TitanMapsIntelligence\Exceptions\MissingHostContractException;

final class EnvironmentSecretResolver implements SecretResolver
{
    public function resolve(string $credentialReference): string
    {
        $reference = trim($credentialReference);
        $name = null;
        foreach (['env://', 'env:'] as $prefix) {
            if (str_starts_with($reference, $prefix)) {
                $name = trim(substr($reference, strlen($prefix)));
                break;
            }
        }

        if ($name === null || $name === '' || preg_match('/^[A-Z0-9_]+$/', $name) !== 1) {
            throw MissingHostContractException::fromCode(
                'MAPS_SECRET_RESOLVER_UNAVAILABLE',
                'No Titan Vault Maps adapter is installed. The extension fallback accepts only env://ENVIRONMENT_VARIABLE credential references.',
            );
        }

        $value = getenv($name);
        if ($value === false || trim($value) === '') {
            throw MissingHostContractException::fromCode(
                'MAPS_SECRET_NOT_FOUND',
                'The configured Maps environment credential could not be resolved.',
                ['credential_reference' => 'env://'.$name],
            );
        }

        return trim($value);
    }
}
