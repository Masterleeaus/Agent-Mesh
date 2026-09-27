<?php

declare(strict_types=1);

namespace App\Extensions\TitanBuilder\System\Security;

use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Http\Request;

/** Resolves the canonical company boundary only from trusted middleware/authenticated actor context. */
final class CompanyContext
{
    public function __construct(private readonly Request $request) {}

    /** @throws AuthorizationException */
    public function id(): int
    {
        $attributeCompany = $this->normalise($this->request->attributes->get('company_id'));
        $user = $this->request->user();
        $userCompany = $this->normalise(is_object($user) ? ($user->company_id ?? null) : null);

        if ($attributeCompany !== null && $userCompany !== null && $attributeCompany !== $userCompany) {
            throw new AuthorizationException('Titan Builder company context conflicts with the authenticated actor.');
        }

        $companyId = $attributeCompany ?? $userCompany;
        if ($companyId === null) {
            throw new AuthorizationException('Titan Builder requires an authenticated company_id context.');
        }

        return $companyId;
    }

    public function actorId(): ?string
    {
        $user = $this->request->user();
        if (! is_object($user)) {
            return null;
        }
        if (method_exists($user, 'getAuthIdentifier')) {
            $id = $user->getAuthIdentifier();
            return $id === null ? null : (string) $id;
        }
        return isset($user->id) ? (string) $user->id : null;
    }

    private function normalise(mixed $value): ?int
    {
        if (is_int($value)) {
            return $value > 0 ? $value : null;
        }

        if (! is_string($value)) {
            return null;
        }

        $value = trim($value);
        if ($value === '' || ! ctype_digit($value)) {
            return null;
        }

        $companyId = filter_var($value, FILTER_VALIDATE_INT, ['options' => ['min_range' => 1]]);
        return $companyId === false ? null : $companyId;
    }
}
