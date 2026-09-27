<?php

declare(strict_types=1);

namespace App\Extensions\TitanBuilder\System\Http\Controllers;

use App\Extensions\TitanBuilder\System\Contracts\PageRepository;
use App\Extensions\TitanBuilder\System\Http\Requests\PageSpecStoreRequest;
use App\Extensions\TitanBuilder\System\Services\DashboardBuilderService;
use App\Extensions\TitanBuilder\System\Security\BuilderAuthorization;
use App\Extensions\TitanBuilder\System\Security\CompanyContext;
use Illuminate\Http\JsonResponse;

/**
 * Dashboard Builder Controller
 * Handles dashboard creation, editing, and template management
 */
final class DashboardBuilderController
{
    public function __construct(
        private readonly CompanyContext $company,
        private readonly PageRepository $pages,
        private readonly DashboardBuilderService $dashboardBuilder,
        private readonly BuilderAuthorization $authorization,
    ) {}

    /**
     * Get widget registry and categories
     */
    public function widgetRegistry(): JsonResponse
    {
        $this->authorization->require('builder.view');

        return response()->json([
            'widgets' => $this->dashboardBuilder->exportWidgetRegistry(),
            'grapesjs_blocks' => $this->dashboardBuilder->getGrapesJsBlockLibrary(),
        ], 200);
    }

    /**
     * Get widget by ID with full metadata
     */
    public function widgetDetails(string $widgetId): JsonResponse
    {
        $this->authorization->require('builder.view');

        $widget = $this->dashboardBuilder->getWidget($widgetId);
        if (!$widget) {
            return response()->json([
                'error' => 'Widget not found',
                'widget_id' => $widgetId,
            ], 404);
        }

        return response()->json([
            'widget' => $widget,
        ], 200);
    }

    /**
     * Get all templates
     */
    public function templates(?string $category = null): JsonResponse
    {
        $this->authorization->require('builder.view');

        $templates = $this->dashboardBuilder->getTemplates($category);

        return response()->json([
            'templates' => array_values($templates),
            'category_filter' => $category,
            'total' => count($templates),
        ], 200);
    }

    /**
     * Get template by ID
     */
    public function templateDetails(string $templateId): JsonResponse
    {
        $this->authorization->require('builder.view');

        $template = $this->dashboardBuilder->getTemplate($templateId);
        if (!$template) {
            return response()->json([
                'error' => 'Template not found',
                'template_id' => $templateId,
            ], 404);
        }

        return response()->json([
            'template' => $template,
        ], 200);
    }

    /**
     * Create dashboard from template
     */
    public function createFromTemplate(
        \Illuminate\Http\Request $request,
        string $templateId,
        int $project
    ): JsonResponse {
        $this->authorization->require('builder.edit');

        // Validate template exists
        $template = $this->dashboardBuilder->getTemplate($templateId);
        if (!$template) {
            return response()->json([
                'error' => 'Template not found',
                'template_id' => $templateId,
            ], 404);
        }

        $companyId = $this->company->id();

        // Create dashboard spec from template
        try {
            $dashboardSpec = $this->dashboardBuilder->createDashboardFromTemplate(
                $templateId,
                $request->input('customizations', [])
            );

            // Create page
            $page = \App\Extensions\TitanBuilder\System\Models\BuilderPage::query()->create([
                'company_id' => $companyId,
                'project_id' => $project,
                'name' => $request->input('name', $template['name'] . ' Copy'),
                'slug' => \Illuminate\Support\Str::slug($request->input('name', $template['name'])),
                'meta' => [
                    'template_id' => $templateId,
                    'created_from_template' => true,
                ],
            ]);

            // Save initial spec
            $savedSpec = $this->pages->saveDraftSpec(
                $companyId,
                $page->id,
                $dashboardSpec,
                $this->company->actorId()
            );

            return response()->json([
                'page' => $page,
                'spec' => $savedSpec,
                'message' => 'Dashboard created from template',
            ], 201);
        } catch (\Exception $e) {
            \Log::error('DashboardBuilderController::createFromTemplate failed', [
                'template_id' => $templateId,
                'error' => $e->getMessage(),
            ]);

            return response()->json([
                'error' => 'Failed to create dashboard',
                'message' => config('app.debug') ? $e->getMessage() : 'An error occurred',
            ], 500);
        }
    }

    /**
     * Validate dashboard spec
     */
    public function validateSpec(\Illuminate\Http\Request $request): JsonResponse
    {
        $this->authorization->require('builder.view');

        $spec = $request->input('spec', []);
        $validation = $this->dashboardBuilder->validateSpec($spec);

        return response()->json([
            'valid' => $validation['valid'],
            'issues' => $validation['issues'],
        ], $validation['valid'] ? 200 : 422);
    }

    /**
     * Export dashboard as JSON
     */
    public function exportDashboard(int $pageId): JsonResponse
    {
        $this->authorization->require('builder.view');

        $companyId = $this->company->id();
        $page = $this->pages->findPageForCompany($companyId, $pageId);

        if (!$page) {
            return response()->json([
                'error' => 'Page not found',
            ], 404);
        }

        $latestSpec = $this->pages->latestSpecForCompany($companyId, $pageId);

        return response()->json([
            'page' => [
                'id' => $page->id,
                'name' => $page->name,
                'slug' => $page->slug,
            ],
            'spec' => $latestSpec?->spec ?? [],
            'exported_at' => now()->toIso8601String(),
        ], 200)->header('Content-Disposition', 'attachment; filename="dashboard-' . $page->slug . '.json"');
    }

    /**
     * Import dashboard from JSON
     */
    public function importDashboard(
        \Illuminate\Http\Request $request,
        int $project
    ): JsonResponse {
        $this->authorization->require('builder.edit');

        $spec = $request->input('spec', []);
        $validation = $this->dashboardBuilder->validateSpec($spec);

        if (!$validation['valid']) {
            return response()->json([
                'error' => 'Import failed: Invalid dashboard spec',
                'issues' => $validation['issues'],
            ], 422);
        }

        $companyId = $this->company->id();

        try {
            // Create page
            $page = \App\Extensions\TitanBuilder\System\Models\BuilderPage::query()->create([
                'company_id' => $companyId,
                'project_id' => $project,
                'name' => $request->input('name', 'Imported Dashboard'),
                'slug' => \Illuminate\Support\Str::slug($request->input('name', 'imported-dashboard')),
                'meta' => [
                    'imported_at' => now()->toIso8601String(),
                ],
            ]);

            // Save spec
            $savedSpec = $this->pages->saveDraftSpec(
                $companyId,
                $page->id,
                $validation['spec'],
                $this->company->actorId()
            );

            return response()->json([
                'page' => $page,
                'spec' => $savedSpec,
                'message' => 'Dashboard imported successfully',
            ], 201);
        } catch (\Exception $e) {
            \Log::error('DashboardBuilderController::importDashboard failed', [
                'error' => $e->getMessage(),
            ]);

            return response()->json([
                'error' => 'Import failed',
                'message' => config('app.debug') ? $e->getMessage() : 'An error occurred',
            ], 500);
        }
    }

    /**
     * Clone dashboard
     */
    public function cloneDashboard(int $sourcePageId, int $project): JsonResponse
    {
        $this->authorization->require('builder.edit');

        $companyId = $this->company->id();
        $sourcePage = $this->pages->findPageForCompany($companyId, $sourcePageId);

        if (!$sourcePage) {
            return response()->json([
                'error' => 'Source dashboard not found',
            ], 404);
        }

        $sourceSpec = $this->pages->latestSpecForCompany($companyId, $sourcePageId);

        try {
            // Create new page
            $newPage = \App\Extensions\TitanBuilder\System\Models\BuilderPage::query()->create([
                'company_id' => $companyId,
                'project_id' => $project,
                'name' => $sourcePage->name . ' (Copy)',
                'slug' => \Illuminate\Support\Str::slug($sourcePage->name . '-copy-' . uniqid()),
                'meta' => $sourcePage->meta ?? [],
            ]);

            // Clone spec
            $clonedSpec = $sourceSpec?->spec ?? [];
            $clonedSpec['metadata']['cloned_from'] = $sourcePageId;
            $clonedSpec['metadata']['cloned_at'] = now()->toIso8601String();

            $savedSpec = $this->pages->saveDraftSpec(
                $companyId,
                $newPage->id,
                $clonedSpec,
                $this->company->actorId()
            );

            return response()->json([
                'page' => $newPage,
                'spec' => $savedSpec,
                'message' => 'Dashboard cloned successfully',
            ], 201);
        } catch (\Exception $e) {
            \Log::error('DashboardBuilderController::cloneDashboard failed', [
                'source_page_id' => $sourcePageId,
                'error' => $e->getMessage(),
            ]);

            return response()->json([
                'error' => 'Clone failed',
                'message' => config('app.debug') ? $e->getMessage() : 'An error occurred',
            ], 500);
        }
    }
}
