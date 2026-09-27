<?php

declare(strict_types=1);

namespace App\Extensions\TitanBuilder\System\Http\Controllers\Management;

use App\Extensions\TitanBuilder\System\Contracts\CapabilityDiscovery;
use App\Extensions\TitanBuilder\System\GenerativeUI\BuilderRegistry;
use App\Extensions\TitanBuilder\System\Management\BuilderSettingsRepository;
use App\Extensions\TitanBuilder\System\Management\ManagementDashboardService;
use App\Extensions\TitanBuilder\System\Security\BuilderAuthorization;
use Illuminate\Contracts\View\View;
use Illuminate\Http\Request;

final class AdminManagementController
{
    public function __construct(
        private readonly BuilderAuthorization $authorization,
        private readonly ManagementDashboardService $dashboard,
        private readonly BuilderSettingsRepository $settings,
        private readonly BuilderRegistry $registry,
        private readonly CapabilityDiscovery $capabilities,
    ) {}

    public function dashboard(): View
    {
        $this->admin();
        return view('titan-builder::management.admin.dashboard', $this->base('Super Admin') + ['summary' => $this->dashboard->platformSummary()]);
    }

    public function integrations(): View
    {
        $this->admin();
        return view('titan-builder::management.admin.integrations', $this->base('Platform Integrations') + ['capabilities' => $this->capabilities->available()]);
    }

    public function registry(): View
    {
        $this->admin();
        return view('titan-builder::management.admin.registry', $this->base('Registry') + ['catalogue' => $this->registry->catalogue()]);
    }

    public function verticals(): View
    {
        $this->admin();
        return view('titan-builder::management.admin.verticals', $this->base('Vertical Packs') + ['verticals' => $this->registry->all('verticals')]);
    }

    public function permissions(Request $request): View
    {
        $this->admin();
        $abilities = [
            'builder.read' => 'View company Builder resources',
            'builder.edit' => 'Create and configure projects/pages/apps',
            'builder.publish' => 'Publish, activate and rollback app versions',
            'builder.assets.manage' => 'Manage company Builder assets',
            'builder.templates.manage' => 'Manage company templates/themes',
            'builder.admin' => 'Access global Titan Builder administration',
        ];
        return view('titan-builder::management.admin.permissions', $this->base('Permission Catalogue') + compact('abilities'));
    }

    public function diagnostics(): View
    {
        $this->admin();
        return view('titan-builder::management.admin.diagnostics', $this->base('Diagnostics') + ['diagnostics' => $this->dashboard->diagnostics()]);
    }

    public function settings(): View
    {
        $this->admin();
        return view('titan-builder::management.admin.settings', $this->base('Platform Settings') + ['settings' => $this->settings->platformSettings()]);
    }

    private function admin(): void
    {
        $this->authorization->require('builder.admin');
    }

    /** @return array<string,mixed> */
    private function base(string $title): array
    {
        return ['title' => $title, 'adminMode' => true, 'companyId' => null, 'managementVersion' => '0.9.2'];
    }
}
