<?php

/**
 * TitanZero Dashboard Builder API Routes
 * 
 * Prefix: /api/builder/titan
 * Middleware: auth, company.context
 * 
 * Endpoints for:
 * - Field service dashboards
 * - AI governance dashboards
 * - Customer management
 * - Revenue & operations
 * - System health monitoring
 */

use App\Extensions\TitanBuilder\System\Http\Controllers\TitanZeroDashboardController;
use Illuminate\Support\Facades\Route;

Route::middleware(['auth:sanctum', 'company.context'])->group(function () {
    
    // Prefix for all TitanZero dashboard routes
    Route::prefix('titan')->group(function () {
        
        // === WIDGET MANAGEMENT ===
        
        /**
         * GET /api/builder/titan/widgets
         * Get all TitanZero widgets (optionally filtered by category/vertical)
         */
        Route::get('widgets', [TitanZeroDashboardController::class, 'getWidgets'])
            ->name('titan.widgets.list');

        /**
         * GET /api/builder/titan/widgets/{id}
         * Get single widget details
         */
        Route::get('widgets/{id}', [TitanZeroDashboardController::class, 'getWidget'])
            ->name('titan.widgets.show');

        
        // === TEMPLATE MANAGEMENT ===
        
        /**
         * GET /api/builder/titan/templates
         * Get all TitanZero templates (optionally filtered by category/vertical)
         */
        Route::get('templates', [TitanZeroDashboardController::class, 'getTemplates'])
            ->name('titan.templates.list');

        /**
         * GET /api/builder/titan/templates/{id}
         * Get single template details
         */
        Route::get('templates/{id}', [TitanZeroDashboardController::class, 'getTemplate'])
            ->name('titan.templates.show');

        /**
         * GET /api/builder/titan/templates/by-vertical/{vertical}
         * Get templates for specific vertical (cleaning, hvac, plumbing, electrical, landscaping)
         */
        Route::get('templates/by-vertical/{vertical}', [TitanZeroDashboardController::class, 'getTemplatesByVertical'])
            ->name('titan.templates.by-vertical');

        
        // === DASHBOARD CREATION & MANAGEMENT ===
        
        /**
         * POST /api/builder/titan/dashboards/from-template/{templateId}
         * Create dashboard from template with customizations
         */
        Route::post('dashboards/from-template/{templateId}', [TitanZeroDashboardController::class, 'createFromTemplate'])
            ->name('titan.dashboards.from-template');

        /**
         * POST /api/builder/titan/dashboards/validate-spec
         * Validate dashboard spec
         */
        Route::post('dashboards/validate-spec', [TitanZeroDashboardController::class, 'validateSpec'])
            ->name('titan.dashboards.validate-spec');

        
        // === REGISTRY & EXPORT ===
        
        /**
         * GET /api/builder/titan/registry/widgets
         * Export complete widget registry
         */
        Route::get('registry/widgets', [TitanZeroDashboardController::class, 'exportWidgetRegistry'])
            ->name('titan.registry.widgets');

        /**
         * GET /api/builder/titan/registry/templates
         * Export complete template registry
         */
        Route::get('registry/templates', [TitanZeroDashboardController::class, 'exportTemplateRegistry'])
            ->name('titan.registry.templates');

        
        // === GRAPESJS VISUAL EDITOR INTEGRATION ===
        
        /**
         * POST /api/builder/titan/dashboards/{id}/to-grapesjs
         * Convert dashboard spec to GrapesJS format
         */
        Route::post('dashboards/{id}/to-grapesjs', [TitanZeroDashboardController::class, 'convertToGrapesJs'])
            ->name('titan.dashboards.to-grapesjs');

        /**
         * POST /api/builder/titan/dashboards/{id}/from-grapesjs
         * Convert GrapesJS data back to internal spec
         */
        Route::post('dashboards/{id}/from-grapesjs', [TitanZeroDashboardController::class, 'convertFromGrapesJs'])
            ->name('titan.dashboards.from-grapesjs');

        /**
         * GET /api/builder/titan/grapesjs/blocks
         * Get GrapesJS block library
         */
        Route::get('grapesjs/blocks', [TitanZeroDashboardController::class, 'getGrapesJsBlocks'])
            ->name('titan.grapesjs.blocks');

        
        // === SYSTEM INFORMATION ===
        
        /**
         * GET /api/builder/titan/system-info
         * Get TitanZero system information
         */
        Route::get('system-info', [TitanZeroDashboardController::class, 'getSystemInfo'])
            ->name('titan.system-info');
    });
});
