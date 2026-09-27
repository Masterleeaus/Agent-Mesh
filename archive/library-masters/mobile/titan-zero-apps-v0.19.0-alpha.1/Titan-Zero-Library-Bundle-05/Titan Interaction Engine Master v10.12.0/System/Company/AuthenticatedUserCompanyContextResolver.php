<?php

declare(strict_types=1);

namespace App\Extensions\InteractionEngine\System\Company;

final class AuthenticatedUserCompanyContextResolver implements CompanyContextResolverContract
{
    /** @var list<string> */
    private array $companyKeys;

    /** @param list<string> $companyKeys */
    public function __construct(array $companyKeys = ['company_id'])
    {
        $keys = array_values(array_unique(array_filter(array_map(
            static fn (mixed $key): string => trim((string) $key),
            $companyKeys,
        ), static fn (string $key): bool => $key !== '')));

        if ($keys === []) {
            throw new \InvalidArgumentException('At least one trusted company identity key must be configured.');
        }

        $this->companyKeys = $keys;
    }

    public function companyIdFromRequest(mixed $request): string
    {
        if (!is_object($request) || !method_exists($request, 'user')) {
            throw new \RuntimeException('Unable to resolve a trusted tenant because no authenticated request is available.');
        }

        return $this->companyId($request->user());
    }

    public function companyId(mixed $authenticatedUser): string
    {
        foreach ($this->companyKeys as $key) {
            $value = $this->read($authenticatedUser, $key);
            if ($value !== null && trim((string) $value) !== '') {
                return (string) $value;
            }
        }

        throw new \RuntimeException('Unable to resolve a trusted tenant for the authenticated actor.');
    }
    private function read(mixed $source, string $key): mixed
    {
        if (is_array($source)) {
            return $source[$key] ?? null;
        }

        if (is_object($source)) {
            if (isset($source->{$key}) || property_exists($source, $key)) {
                return $source->{$key};
            }

            $method = 'get' . str_replace(' ', '', ucwords(str_replace('_', ' ', $key)));
            if (method_exists($source, $method)) {
                return $source->{$method}();
            }
        }

        return null;
    }
}
