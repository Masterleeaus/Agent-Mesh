<?php

declare(strict_types=1);

namespace App\Extensions\InteractionEngine\System\Http\Controllers;

use App\Extensions\InteractionEngine\System\Journey\JourneyRegistry;
use App\Extensions\InteractionEngine\System\Settings\SettingsPolicy;
use App\Extensions\InteractionEngine\System\Settings\SettingsRepository;
use App\Extensions\InteractionEngine\System\Settings\SettingsResolver;
use App\Extensions\InteractionEngine\System\Company\CompanyContextResolverContract;
use App\Extensions\InteractionEngine\System\Wizard\Context\WizardExecutionContextFactory;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\View\View;

final class CompanySettingsController
{
    public function __construct(
        private readonly SettingsRepository $repository,
        private readonly SettingsResolver $settings,
        private readonly SettingsPolicy $policy,
        private readonly CompanyContextResolverContract $tenants,
        private readonly WizardExecutionContextFactory $contexts,
        private readonly JourneyRegistry $journeys,
    ) {}

    public function index(Request $request): View
    {
        $context = $this->actorContext($request);
        $companyId = $this->tenants->companyId($request->user());
        $userId = (int) ($context['user_id'] ?? 0);
        $roles = array_values(array_map('strval', (array) ($context['roles'] ?? [])));
        $canManageCompany = array_intersect($roles, ['owner','admin']) !== [];

        return view('interaction-engine::settings.user', [
            'companyId' => $companyId,
            'companySettings' => $this->settings->companySnapshot($companyId),
            'userSettings' => $this->settings->userSnapshot($companyId, $userId),
            'canManageCompany' => $canManageCompany,
            'roles' => $roles,
            'journeys' => array_map(static fn ($journey): array => $journey->toArray(), $this->journeys->forSurface('zero')),
        ]);
    }

    public function updateCompany(Request $request): RedirectResponse
    {
        $context = $this->actorContext($request);
        $roles = array_values(array_map('strval', (array) ($context['roles'] ?? [])));
        if (array_intersect($roles, ['owner','admin']) === []) abort(403, 'Company Interaction settings require owner/admin authority.');

        $companyId = $this->tenants->companyId($request->user());
        $clean = $this->policy->sanitizeCompany($request->all());
        $this->repository->putCompanyMany($companyId, $clean, (string) ($context['user_id'] ?? ''));

        return redirect()->back()->with('status', 'Company Interaction settings updated.');
    }

    public function updatePreferences(Request $request): RedirectResponse
    {
        $context = $this->actorContext($request);
        $companyId = $this->tenants->companyId($request->user());
        $userId = (int) ($context['user_id'] ?? 0);
        if ($userId <= 0) abort(401, 'Authenticated user identity is required.');
        $clean = $this->policy->sanitizeUser($request->all());
        $this->repository->putUserMany($companyId, $userId, $clean);

        return redirect()->back()->with('status', 'Your Interaction preferences were updated.');
    }

    private function actorContext(Request $request): array
    {
        return $this->contexts->build($request->user(), ['source_surface' => 'zero'], $request->headers->all(), $this->trustedAuth($request));
    }

    private function trustedAuth(Request $request): array
    {
        if (!$request->hasSession()) return [];
        $timestamp = $request->session()->get('auth.password_confirmed_at');
        return is_numeric($timestamp) && (int) $timestamp > 0 ? ['authenticated_at' => (int) $timestamp] : [];
    }
}
