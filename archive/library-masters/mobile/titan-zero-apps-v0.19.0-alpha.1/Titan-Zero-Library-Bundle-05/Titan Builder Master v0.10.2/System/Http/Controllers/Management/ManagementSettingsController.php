<?php

declare(strict_types=1);

namespace App\Extensions\TitanBuilder\System\Http\Controllers\Management;

use App\Extensions\TitanBuilder\System\Management\BuilderSettingsRepository;
use App\Extensions\TitanBuilder\System\Security\BuilderAuthorization;
use App\Extensions\TitanBuilder\System\Security\CompanyContext;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;

final class ManagementSettingsController
{
    public function __construct(
        private readonly CompanyContext $company,
        private readonly BuilderAuthorization $authorization,
        private readonly BuilderSettingsRepository $settings,
    ) {}

    public function company(Request $request): RedirectResponse
    {
        $this->authorization->require('builder.edit');
        $data = $request->validate([
            'default_surface' => ['required','in:customer,field,owner,onboarding'],
            'preview_device' => ['required','in:mobile,tablet,desktop'],
            'preview_network_state' => ['required','in:online,offline,syncing,conflict,empty,populated,loading,error,permission-denied'],
            'default_theme_mode' => ['required','in:system,light,dark'],
            'ai_assistance' => ['nullable','boolean'],
            'show_readiness_warnings' => ['nullable','boolean'],
            'compact_navigation' => ['nullable','boolean'],
            'reduced_motion' => ['nullable','boolean'],
        ]);
        foreach (['ai_assistance','show_readiness_warnings','compact_navigation','reduced_motion'] as $flag) {
            $data[$flag] = $request->boolean($flag);
        }
        $this->settings->updateCompanySettings($this->company->id(), $data, $this->company->actorId());
        return back()->with('status', 'Titan Builder company settings saved.');
    }

    public function admin(Request $request): RedirectResponse
    {
        $this->authorization->require('builder.admin');
        $data = $request->validate([
            'default_preview_device' => ['required','in:mobile,tablet,desktop'],
            'diagnostics_level' => ['required','in:minimal,standard,verbose'],
            'management_ui_enabled' => ['nullable','boolean'],
            'ai_generation_enabled' => ['nullable','boolean'],
            'asset_uploads_enabled' => ['nullable','boolean'],
            'premium_mobile_enabled' => ['nullable','boolean'],
            'show_experimental_resources' => ['nullable','boolean'],
        ]);
        foreach (['management_ui_enabled','ai_generation_enabled','asset_uploads_enabled','premium_mobile_enabled','show_experimental_resources'] as $flag) {
            $data[$flag] = $request->boolean($flag);
        }
        $actor = $request->user();
        $actorId = is_object($actor) && method_exists($actor, 'getAuthIdentifier') ? (string) $actor->getAuthIdentifier() : null;
        $this->settings->updatePlatformSettings($data, $actorId);
        return back()->with('status', 'Titan Builder platform settings saved.');
    }
}
