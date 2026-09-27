<?php

declare(strict_types=1);

namespace App\Extensions\TitanMapsIntelligence\Services;

use App\Extensions\TitanMapsIntelligence\Contracts\AuthorisedCompanyContext;
use App\Extensions\TitanMapsIntelligence\Exceptions\MissingHostContractException;
use Illuminate\Http\Request;

final class RequestAuthorisedCompanyContext implements AuthorisedCompanyContext
{
    public function __construct(private readonly Request $request) {}

    public function companyId(): string
    {
        // company_id is the sole canonical company boundary. Legacy active/current
        // company selectors must be normalized by the host before Maps is invoked.
        $value = $this->firstNonEmpty([
            $this->request->attributes->get('company_id'),
            $this->trustedCrmCompanyId(),
            $this->crmScopeCompanyId(),
            $this->safeSessionValue('company_id'),
            $this->userValue('company_id'),
        ]);

        if ($value === null) {
            throw MissingHostContractException::fromCode(
                'MAPS_COMPANY_CONTEXT_UNAVAILABLE',
                'Titan Maps Intelligence could not resolve the authorised company from the current request. Bind a host AuthorisedCompanyContext adapter or expose company_id through the authenticated request context.',
            );
        }

        return $value;
    }

    public function userId(): string
    {
        $user = $this->request->user();
        $value = $user !== null && method_exists($user, 'getAuthIdentifier')
            ? $user->getAuthIdentifier()
            : $this->userValue('id');
        $resolved = $this->stringValue($value);

        if ($resolved === null) {
            throw MissingHostContractException::fromCode(
                'MAPS_USER_CONTEXT_UNAVAILABLE',
                'Titan Maps Intelligence requires an authenticated user context.',
            );
        }

        return $resolved;
    }

    public function branchId(): ?string
    {
        return $this->firstNonEmpty([
            $this->request->attributes->get('branch_id'),
            $this->safeSessionValue('branch_id'),
            $this->userValue('branch_id'),
        ]);
    }

    public function workspaceId(): ?string
    {
        return $this->firstNonEmpty([
            $this->request->attributes->get('workspace_id'),
            $this->safeSessionValue('workspace_id'),
            $this->userValue('workspace_id'),
        ]);
    }


    private function trustedCrmCompanyId(): mixed
    {
        $context = $this->request->attributes->get('crm_company_context');
        if (is_object($context) && isset($context->companyId)) {
            return $context->companyId;
        }
        if (is_array($context)) {
            return $context['company_id'] ?? null;
        }

        return null;
    }

    private function crmScopeCompanyId(): mixed
    {
        $scope = 'App\\Extensions\\Crm\\System\\Tenancy\\CrmCompanyScope';
        if (! class_exists($scope)) {
            return null;
        }
        try {
            return $scope::companyId();
        } catch (\Throwable) {
            return null;
        }
    }

    private function userValue(string $key): mixed
    {
        $user = $this->request->user();
        if ($user === null) {
            return null;
        }
        if (isset($user->{$key}) || property_exists($user, $key)) {
            return $user->{$key};
        }
        if (method_exists($user, 'getAttribute')) {
            return $user->getAttribute($key);
        }

        return null;
    }

    private function safeSessionValue(string $key): mixed
    {
        try {
            return $this->request->hasSession() ? $this->request->session()->get($key) : null;
        } catch (\Throwable) {
            return null;
        }
    }

    /** @param array<int, mixed> $values */
    private function firstNonEmpty(array $values): ?string
    {
        foreach ($values as $value) {
            $resolved = $this->stringValue($value);
            if ($resolved !== null) {
                return $resolved;
            }
        }

        return null;
    }

    private function stringValue(mixed $value): ?string
    {
        if (! is_scalar($value)) {
            return null;
        }
        $value = trim((string) $value);

        return $value === '' ? null : $value;
    }
}
