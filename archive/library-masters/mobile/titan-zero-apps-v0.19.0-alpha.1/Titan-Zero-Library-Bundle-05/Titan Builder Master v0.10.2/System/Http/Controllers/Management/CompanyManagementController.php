<?php

declare(strict_types=1);

namespace App\Extensions\TitanBuilder\System\Http\Controllers\Management;

use App\Extensions\TitanBuilder\System\Contracts\ApplicationProvisioningGateway;
use App\Extensions\TitanBuilder\System\Contracts\CapabilityDiscovery;
use App\Extensions\TitanBuilder\System\Contracts\PageRepository;
use App\Extensions\TitanBuilder\System\GenerativeUI\BuilderRegistry;
use App\Extensions\TitanBuilder\System\Management\BuilderSettingsRepository;
use App\Extensions\TitanBuilder\System\Management\ManagementDashboardService;
use App\Extensions\TitanBuilder\System\Models\BuilderAsset;
use App\Extensions\TitanBuilder\System\Models\BuilderProject;
use App\Extensions\TitanBuilder\System\Models\BuilderTheme;
use App\Extensions\TitanBuilder\System\Models\BuilderVersion;
use App\Extensions\TitanBuilder\System\Models\PublishSnapshot;
use App\Extensions\TitanBuilder\System\Security\BuilderAuthorization;
use App\Extensions\TitanBuilder\System\Security\CompanyContext;
use Illuminate\Contracts\View\View;
use Illuminate\Http\Request;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;

final class CompanyManagementController
{
    private const SURFACES = ['customer','field','owner','onboarding'];

    public function __construct(
        private readonly CompanyContext $company,
        private readonly BuilderAuthorization $authorization,
        private readonly ManagementDashboardService $dashboard,
        private readonly BuilderSettingsRepository $settings,
        private readonly ApplicationProvisioningGateway $applications,
        private readonly CapabilityDiscovery $capabilities,
        private readonly BuilderRegistry $registry,
        private readonly PageRepository $pages,
    ) {}

    public function dashboard(): View
    {
        $this->authorization->require('builder.read');
        $companyId = $this->company->id();
        return view('titan-builder::management.company.dashboard', $this->base('Dashboard') + [
            'summary' => $this->dashboard->companySummary($companyId),
        ]);
    }

    public function projects(): View
    {
        $this->authorization->require('builder.read');
        $companyId = $this->company->id();
        $projects = BuilderProject::query()->forCompany($companyId)->latest('updated_at')->get();
        $pageCounts = [];
        foreach ($projects as $project) {
            $pageCounts[(int) $project->getKey()] = count($this->pages->pagesForProject($companyId, (int) $project->getKey()));
        }
        return view('titan-builder::management.company.projects', $this->base('Projects') + compact('projects', 'pageCounts'));
    }

    public function project(int $project): View
    {
        $this->authorization->require('builder.read');
        $companyId = $this->company->id();
        $record = BuilderProject::query()->forCompany($companyId)->whereKey($project)->first();
        if (! $record) throw new NotFoundHttpException('Project not found.');
        $pages = $this->pages->pagesForProject($companyId, $project);
        $specs = [];
        foreach ($pages as $page) {
            $latest = $this->pages->latestSpecForCompany($companyId, (int) $page->getKey());
            $specs[(int) $page->getKey()] = $latest?->spec ?? null;
        }
        $snapshots = PublishSnapshot::query()->forCompany($companyId)->where('project_id', $project)->latest('id')->limit(20)->get();
        $versions = BuilderVersion::query()->forCompany($companyId)->where('project_id', $project)->latest('id')->limit(20)->get();
        $catalogue = $this->registry->catalogue();
        return view('titan-builder::management.company.project-editor', $this->base('Project Editor') + compact('record','pages','specs','snapshots','versions','catalogue'));
    }

    public function applications(): View
    {
        $this->authorization->require('builder.read');
        $companyId = $this->company->id();
        $applications = $this->applications->getApplications($companyId);
        $bySurface = [];
        foreach ($applications as $application) {
            if (is_array($application) && is_string($application['surface'] ?? null)) {
                $bySurface[$application['surface']] = $application;
            }
        }
        $readiness = [];
        foreach (self::SURFACES as $surface) {
            $readiness[$surface] = isset($bySurface[$surface])
                ? $this->applications->getReadiness($companyId, $surface)
                : ['status' => 'blocked', 'reasons' => [['code' => 'application.missing', 'severity' => 'blocked', 'message' => 'Application has not been provisioned yet.']]];
        }
        return view('titan-builder::management.company.applications', $this->base('Applications') + compact('applications','readiness'));
    }

    public function application(string $surface): View
    {
        $this->authorization->require('builder.read');
        if (! in_array($surface, self::SURFACES, true)) throw new NotFoundHttpException('Application surface not found.');
        $companyId = $this->company->id();
        $application = $this->applications->getApplication($companyId, $surface);
        $readiness = $application !== null
            ? $this->applications->getReadiness($companyId, $surface)
            : ['status' => 'blocked', 'reasons' => [['code' => 'application.missing', 'severity' => 'blocked', 'message' => 'Application has not been provisioned yet.']]];
        return view('titan-builder::management.company.application', $this->base('Application') + compact('surface','application','readiness'));
    }

    public function assets(): View
    {
        $this->authorization->require('builder.read');
        $companyId = $this->company->id();
        $assets = BuilderAsset::query()->forCompany($companyId)->latest('id')->limit(200)->get();
        $projects = BuilderProject::query()->forCompany($companyId)->orderBy('name')->get();
        return view('titan-builder::management.company.assets', $this->base('Assets') + compact('assets','projects'));
    }

    public function brand(): View
    {
        $this->authorization->require('builder.read');
        $companyId = $this->company->id();
        $applications = $this->applications->getApplications($companyId);
        $themes = BuilderTheme::query()->forCompany($companyId)->latest('is_default')->orderBy('name')->get();
        $packagedThemes = $this->registry->all('themes');
        return view('titan-builder::management.company.brand', $this->base('Brand & Theme') + compact('applications','themes','packagedThemes'));
    }

    public function integrations(): View
    {
        $this->authorization->require('builder.read');
        $companyId = $this->company->id();
        return view('titan-builder::management.company.integrations', $this->base('Integrations') + [
            'capabilities' => $this->capabilities->available($companyId),
            'catalogue' => $this->registry->catalogue(),
        ]);
    }

    public function settings(): View
    {
        $this->authorization->require('builder.read');
        return view('titan-builder::management.company.settings', $this->base('Settings') + [
            'settings' => $this->settings->companySettings($this->company->id()),
        ]);
    }

    public function permissions(Request $request): View
    {
        $this->authorization->require('builder.read');
        $user = $request->user();
        $abilities = ['builder.read','builder.edit','builder.publish','builder.assets.manage','builder.templates.manage','builder.admin'];
        $grants = [];
        foreach ($abilities as $ability) {
            $grants[$ability] = $this->authorization->allows($ability);
        }
        return view('titan-builder::management.company.permissions', $this->base('Permissions') + compact('grants'));
    }

    /** @return array<string,mixed> */
    private function base(string $title): array
    {
        return [
            'title' => $title,
            'adminMode' => false,
            'companyId' => $this->company->id(),
            'managementVersion' => '0.9.2',
        ];
    }
}
