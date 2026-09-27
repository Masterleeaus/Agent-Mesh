<?php

declare(strict_types=1);

namespace App\Extensions\InteractionEngine\System\Http\Controllers;

use App\Extensions\InteractionEngine\System\Journey\JourneyRegistry;
use App\Extensions\InteractionEngine\System\Settings\SettingsPolicy;
use App\Extensions\InteractionEngine\System\Settings\SettingsRepository;
use App\Extensions\InteractionEngine\System\Settings\SettingsResolver;
use App\Extensions\InteractionEngine\System\Company\CompanyContextResolverContract;
use App\Extensions\InteractionEngine\System\Wizard\Context\WizardExecutionContextFactory;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

final class SettingsApiController
{
    public function __construct(
        private readonly SettingsRepository $repository,
        private readonly SettingsResolver $settings,
        private readonly SettingsPolicy $policy,
        private readonly CompanyContextResolverContract $tenants,
        private readonly WizardExecutionContextFactory $contexts,
        private readonly JourneyRegistry $journeys,
    ) {}

    public function show(Request $request): JsonResponse
    {
        $actor = $this->actor($request);
        $companyId = $this->tenants->companyId($request->user());
        $userId = (int) ($actor['user_id'] ?? 0);
        $roles = array_values(array_map('strval', (array) ($actor['roles'] ?? [])));
        $canManage = array_intersect($roles, ['owner','admin']) !== [];

        return response()->json([
            'company_id' => $companyId,
            'personal' => $this->settings->userSnapshot($companyId, $userId),
            'effective' => $this->settings->presentationSnapshot($companyId, $userId),
            'company' => $canManage ? $this->settings->companySnapshot($companyId) : null,
            'can_manage_company' => $canManage,
            'configuration_journeys' => $canManage
                ? array_values(array_map(static fn ($journey): array => $journey->toArray(), $this->journeys->forSurface('zero')))
                : [],
        ]);
    }

    public function updateCompany(Request $request): JsonResponse
    {
        $actor = $this->actor($request);
        $roles = array_values(array_map('strval', (array) ($actor['roles'] ?? [])));
        if (array_intersect($roles, ['owner','admin']) === []) return response()->json(['message' => 'Company settings require owner/admin authority.'], 403);
        $companyId = $this->tenants->companyId($request->user());
        $clean = $this->policy->sanitizeCompany($request->all());
        $this->repository->putCompanyMany($companyId, $clean, (string) ($actor['user_id'] ?? ''));
        return response()->json(['company_id' => $companyId, 'settings' => $this->settings->companySnapshot($companyId)]);
    }

    public function updatePreferences(Request $request): JsonResponse
    {
        $actor = $this->actor($request);
        $companyId = $this->tenants->companyId($request->user());
        $userId = (int) ($actor['user_id'] ?? 0);
        if ($userId <= 0) return response()->json(['message' => 'Authenticated user identity is required.'], 401);
        $clean = $this->policy->sanitizeUser($request->all());
        $this->repository->putUserMany($companyId, $userId, $clean);
        return response()->json([
            'company_id' => $companyId,
            'personal' => $this->settings->userSnapshot($companyId, $userId),
            'effective' => $this->settings->presentationSnapshot($companyId, $userId),
        ]);
    }

    private function actor(Request $request): array
    {
        return $this->contexts->build($request->user(), ['source_surface' => (string) ($request->input('surface', 'api'))], $request->headers->all(), $this->trustedAuth($request));
    }

    private function trustedAuth(Request $request): array
    {
        if (!$request->hasSession()) return [];
        $timestamp = $request->session()->get('auth.password_confirmed_at');
        return is_numeric($timestamp) && (int) $timestamp > 0 ? ['authenticated_at' => (int) $timestamp] : [];
    }
}
