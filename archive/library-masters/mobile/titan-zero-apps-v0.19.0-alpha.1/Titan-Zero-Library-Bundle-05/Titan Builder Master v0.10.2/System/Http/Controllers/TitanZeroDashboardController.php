<?php

declare(strict_types=1);

namespace App\Extensions\TitanBuilder\System\Http\Controllers;

use App\Extensions\TitanBuilder\System\Services\TitanZeroDashboardService;
use App\Extensions\TitanBuilder\System\Services\GrapesJsIntegrationService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * TitanZero Dashboard Builder Controller
 * 
 * API endpoints for field service dashboards:
 * - Field operations (dispatch, jobs, technicians)
 * - AI governance (Model Council, Risk Engine, Autonomy)
 * - Customer management
 * - Revenue & billing
 * - System health
 */
class TitanZeroDashboardController
{
    private TitanZeroDashboardService $dashboardService;
    private GrapesJsIntegrationService $grapesJs;

    public function __construct()
    {
        $this->dashboardService = app(TitanZeroDashboardService::class);
        $this->grapesJs = app(GrapesJsIntegrationService::class);
    }

    /**
     * GET /api/builder/titan/widgets
     * Get all TitanZero widgets, optionally filtered by category or vertical
     */
    public function getWidgets(Request $request): JsonResponse
    {
        $category = $request->query('category');
        $vertical = $request->query('vertical'); // cleaning, hvac, plumbing, electrical, landscaping, all

        $widgets = $this->dashboardService->getWidgets($category, $vertical);

        return response()->json([
            'status' => 'success',
            'data' => array_values($widgets),
            'meta' => [
                'total' => count($widgets),
                'category' => $category,
                'vertical' => $vertical,
            ],
        ]);
    }

    /**
     * GET /api/builder/titan/widgets/{id}
     * Get single widget details
     */
    public function getWidget(string $id): JsonResponse
    {
        $widget = $this->dashboardService->getWidget($id);

        if (!$widget) {
            return response()->json([
                'status' => 'error',
                'message' => "Widget '{$id}' not found",
            ], 404);
        }

        return response()->json([
            'status' => 'success',
            'data' => $widget,
        ]);
    }

    /**
     * GET /api/builder/titan/templates
     * Get all TitanZero templates, optionally filtered by category or vertical
     */
    public function getTemplates(Request $request): JsonResponse
    {
        $category = $request->query('category');
        $vertical = $request->query('vertical', 'all');

        $templates = $this->dashboardService->getTemplates($category, $vertical);

        return response()->json([
            'status' => 'success',
            'data' => array_values($templates),
            'meta' => [
                'total' => count($templates),
                'category' => $category,
                'vertical' => $vertical,
            ],
        ]);
    }

    /**
     * GET /api/builder/titan/templates/by-vertical/{vertical}
     * Get templates for a specific vertical (cleaning, hvac, plumbing, electrical, landscaping)
     */
    public function getTemplatesByVertical(string $vertical): JsonResponse
    {
        $templates = $this->dashboardService->getTemplatesByVertical($vertical);

        return response()->json([
            'status' => 'success',
            'data' => array_values($templates),
            'meta' => [
                'total' => count($templates),
                'vertical' => $vertical,
            ],
        ]);
    }

    /**
     * GET /api/builder/titan/templates/{id}
     * Get single template details
     */
    public function getTemplate(string $id): JsonResponse
    {
        $template = $this->dashboardService->getTemplate($id);

        if (!$template) {
            return response()->json([
                'status' => 'error',
                'message' => "Template '{$id}' not found",
            ], 404);
        }

        return response()->json([
            'status' => 'success',
            'data' => $template,
        ]);
    }

    /**
     * POST /api/builder/titan/dashboards/from-template/{templateId}
     * Create dashboard from template
     */
    public function createFromTemplate(Request $request, string $templateId): JsonResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'vertical' => 'nullable|in:cleaning,hvac,plumbing,electrical,landscaping,all',
            'customizations' => 'nullable|array',
        ]);

        try {
            $spec = $this->dashboardService->createDashboardFromTemplate(
                $templateId,
                $validated['customizations'] ?? []
            );

            $checksum = $this->dashboardService->generateChecksum($spec);

            return response()->json([
                'status' => 'success',
                'data' => [
                    'spec' => $spec,
                    'checksum' => $checksum,
                    'name' => $validated['name'],
                    'vertical' => $validated['vertical'] ?? 'all',
                    'template_id' => $templateId,
                ],
            ], 201);
        } catch (\InvalidArgumentException $e) {
            return response()->json([
                'status' => 'error',
                'message' => $e->getMessage(),
            ], 404);
        }
    }

    /**
     * POST /api/builder/titan/dashboards/validate-spec
     * Validate dashboard spec
     */
    public function validateSpec(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'spec' => 'required|array',
        ]);

        $result = $this->dashboardService->validateSpec($validated['spec']);

        return response()->json([
            'status' => $result['valid'] ? 'success' : 'error',
            'data' => $result,
        ], $result['valid'] ? 200 : 422);
    }

    /**
     * GET /api/builder/titan/registry/widgets
     * Export complete widget registry
     */
    public function exportWidgetRegistry(): JsonResponse
    {
        $registry = $this->dashboardService->exportWidgetRegistry();

        return response()->json([
            'status' => 'success',
            'data' => $registry,
        ]);
    }

    /**
     * GET /api/builder/titan/registry/templates
     * Export complete template registry
     */
    public function exportTemplateRegistry(): JsonResponse
    {
        $registry = $this->dashboardService->exportTemplateRegistry();

        return response()->json([
            'status' => 'success',
            'data' => $registry,
        ]);
    }

    /**
     * POST /api/builder/titan/dashboards/{id}/to-grapesjs
     * Convert dashboard spec to GrapesJS format for visual editing
     */
    public function convertToGrapesJs(Request $request, string $id): JsonResponse
    {
        $validated = $request->validate([
            'spec' => 'required|array',
        ]);

        try {
            $grapesData = $this->grapesJs->toGrapesJsFormat($validated['spec']);

            return response()->json([
                'status' => 'success',
                'data' => $grapesData,
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'Failed to convert to GrapesJS format: ' . $e->getMessage(),
            ], 400);
        }
    }

    /**
     * POST /api/builder/titan/dashboards/{id}/from-grapesjs
     * Convert GrapesJS data back to internal spec
     */
    public function convertFromGrapesJs(Request $request, string $id): JsonResponse
    {
        $validated = $request->validate([
            'grapesjs_data' => 'required|array',
        ]);

        try {
            $spec = $this->grapesJs->toInternalSpec($validated['grapesjs_data']);

            return response()->json([
                'status' => 'success',
                'data' => $spec,
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'Failed to convert from GrapesJS format: ' . $e->getMessage(),
            ], 400);
        }
    }

    /**
     * GET /api/builder/titan/grapesjs/blocks
     * Get GrapesJS block library from TitanZero widgets
     */
    public function getGrapesJsBlocks(Request $request): JsonResponse
    {
        $vertical = $request->query('vertical', 'all');
        $widgets = $this->dashboardService->getTemplatesByVertical($vertical);

        $blockLibrary = [];
        foreach ($widgets as $template) {
            foreach ($template['widgets'] ?? [] as $widgetConfig) {
                $widget = $this->dashboardService->getWidget($widgetConfig['id']);
                if ($widget) {
                    $blockLibrary[] = [
                        'id' => $widget['id'],
                        'label' => $widget['name'],
                        'category' => $widget['category'] ?? 'default',
                        'content' => [
                            'type' => 'widget',
                            'widgetId' => $widget['id'],
                        ],
                    ];
                }
            }
        }

        return response()->json([
            'status' => 'success',
            'data' => array_values(array_unique($blockLibrary, SORT_REGULAR)),
        ]);
    }

    /**
     * GET /api/builder/titan/system-info
     * Get TitanZero system information
     */
    public function getSystemInfo(): JsonResponse
    {
        return response()->json([
            'status' => 'success',
            'data' => [
                'system' => 'TitanZero',
                'version' => '3.0',
                'subsystems' => [
                    'titan-hub' => 'Customer app',
                    'titan-go' => 'Field technician mobile',
                    'titan-core' => 'Configuration & settings',
                    'titan-bos' => 'Business Operating System',
                    'titan-pay' => 'Billing & payments (ZeroPay)',
                    'titan-gear' => 'Assets & fleet management',
                ],
                'ai_tiers' => [
                    'Uno' => 'Task automation',
                    'Duo' => 'Workflow optimization',
                    'Trio' => 'Custom agents',
                    'Quattro' => 'Full autonomy',
                ],
                'service_verticals' => [
                    'cleaning' => 'House/office cleaning',
                    'hvac' => 'Heating/cooling/ventilation',
                    'plumbing' => 'Water services',
                    'electrical' => 'Electrical services',
                    'landscaping' => 'Outdoor maintenance',
                ],
                'features' => [
                    'offline_first' => 'LocalBrain offline sync',
                    'voice_first' => 'Voice-driven UX',
                    'ai_governance' => 'Five-tier AI hierarchy',
                    'real_time_dispatch' => 'Live job routing',
                    'fee_free_payments' => 'ZeroPay rails',
                    'multi_tenancy' => 'Multi-tenant isolation',
                ],
            ],
        ]);
    }
}
