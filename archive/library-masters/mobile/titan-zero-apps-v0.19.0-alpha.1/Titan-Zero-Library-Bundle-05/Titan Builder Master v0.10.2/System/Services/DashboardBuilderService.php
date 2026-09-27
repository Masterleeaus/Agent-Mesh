<?php

declare(strict_types=1);

namespace App\Extensions\TitanBuilder\System\Services;

use App\Extensions\TitanBuilder\System\Support\CanonicalJson;
use InvalidArgumentException;

/**
 * NEW: Dashboard Builder Service
 * Unified widget system combining:
 * - TitanBuilder native widgets (page editor)
 * - Code 2.0 dashboard components (React templates)
 * - GrapesJS blocks
 */
final class DashboardBuilderService
{
    /**
     * Widget registry (Code 2.0 + native)
     */
    private array $widgetRegistry = [];

    /**
     * Template registry (predefined dashboards)
     */
    private array $templateRegistry = [];

    public function __construct()
    {
        $this->initializeWidgetRegistry();
        $this->initializeTemplateRegistry();
    }

    /**
     * Initialize Code 2.0 widget registry
     * Maps React components to internal widget format
     */
    private function initializeWidgetRegistry(): void
    {
        // DATA DISPLAY WIDGETS
        $this->registerWidget([
            'id' => 'code2-card',
            'name' => 'Card',
            'category' => 'data-display',
            'description' => 'Flexible card container with optional header and footer',
            'react_component' => 'Card',
            'icon' => 'card',
            'default_props' => [
                'title' => 'Card Title',
                'variant' => 'default',
                'padding' => 'md',
            ],
            'editable_fields' => ['title', 'content', 'variant'],
        ]);

        $this->registerWidget([
            'id' => 'code2-table',
            'name' => 'Data Table',
            'category' => 'data-display',
            'description' => 'Advanced data table with sorting, filtering, pagination',
            'react_component' => 'Table',
            'icon' => 'table',
            'default_props' => [
                'columns' => [],
                'data' => [],
                'sortable' => true,
                'filterable' => true,
            ],
            'editable_fields' => ['columns', 'data'],
        ]);

        $this->registerWidget([
            'id' => 'code2-chart-balance',
            'name' => 'Balance Chart',
            'category' => 'charts',
            'description' => 'Area chart for balance/earnings visualization',
            'react_component' => 'Balance',
            'icon' => 'chart-area',
            'default_props' => [
                'title' => 'Balance',
                'data_source' => 'homeBalanceChartData',
                'height' => 'auto',
            ],
            'data_sources' => ['homeBalanceChartData'],
        ]);

        $this->registerWidget([
            'id' => 'code2-stat-card',
            'name' => 'Stat Card',
            'category' => 'data-display',
            'description' => 'Display key metric with label and optional trend',
            'react_component' => 'StatCard',
            'icon' => 'metric',
            'default_props' => [
                'label' => 'Metric',
                'value' => '0',
                'trend' => null,
                'format' => 'number',
            ],
            'editable_fields' => ['label', 'value', 'trend'],
        ]);

        $this->registerWidget([
            'id' => 'code2-grid-product',
            'name' => 'Product Grid',
            'category' => 'ecommerce',
            'description' => 'Display products in responsive grid layout',
            'react_component' => 'GridProduct',
            'icon' => 'grid',
            'default_props' => [
                'columns' => 3,
                'gap' => 'md',
                'items_per_page' => 12,
            ],
            'data_sources' => ['products'],
        ]);

        $this->registerWidget([
            'id' => 'code2-refund-requests',
            'name' => 'Refund Requests',
            'category' => 'ecommerce',
            'description' => 'Table of pending refund requests with actions',
            'react_component' => 'RefundRequests',
            'icon' => 'refund',
            'default_props' => [
                'show_filters' => true,
                'show_pagination' => true,
            ],
            'data_sources' => ['refunds'],
        ]);

        $this->registerWidget([
            'id' => 'code2-popular-products',
            'name' => 'Popular Products',
            'category' => 'ecommerce',
            'description' => 'List of top-selling products with stats',
            'react_component' => 'PopularProducts',
            'icon' => 'trending-up',
            'default_props' => [
                'limit' => 10,
                'show_stats' => true,
            ],
            'data_sources' => ['products', 'sales'],
        ]);

        // FORM WIDGETS
        $this->registerWidget([
            'id' => 'code2-field-text',
            'name' => 'Text Input',
            'category' => 'form',
            'description' => 'Text input field with validation',
            'react_component' => 'Field',
            'icon' => 'text',
            'default_props' => [
                'label' => 'Label',
                'placeholder' => 'Enter text...',
                'required' => false,
            ],
            'editable_fields' => ['label', 'placeholder', 'required'],
        ]);

        $this->registerWidget([
            'id' => 'code2-field-image',
            'name' => 'Image Upload',
            'category' => 'form',
            'description' => 'Image upload field with preview',
            'react_component' => 'FieldImage',
            'icon' => 'image',
            'default_props' => [
                'label' => 'Upload Image',
                'max_size' => 5000000, // 5MB
                'accept' => 'image/*',
            ],
            'editable_fields' => ['label', 'max_size'],
        ]);

        $this->registerWidget([
            'id' => 'code2-field-files',
            'name' => 'File Upload',
            'category' => 'form',
            'description' => 'Multi-file upload field',
            'react_component' => 'FieldFiles',
            'icon' => 'file',
            'default_props' => [
                'label' => 'Upload Files',
                'multiple' => true,
                'max_files' => 10,
            ],
            'editable_fields' => ['label', 'multiple', 'max_files'],
        ]);

        $this->registerWidget([
            'id' => 'code2-select',
            'name' => 'Select Dropdown',
            'category' => 'form',
            'description' => 'Dropdown select field',
            'react_component' => 'Select',
            'icon' => 'dropdown',
            'default_props' => [
                'label' => 'Select',
                'options' => [],
                'multiple' => false,
            ],
            'editable_fields' => ['label', 'options'],
        ]);

        $this->registerWidget([
            'id' => 'code2-checkbox',
            'name' => 'Checkbox',
            'category' => 'form',
            'description' => 'Single or multiple checkboxes',
            'react_component' => 'Checkbox',
            'icon' => 'checkbox',
            'default_props' => [
                'label' => 'Agree',
                'checked' => false,
            ],
            'editable_fields' => ['label', 'checked'],
        ]);

        // UI WIDGETS
        $this->registerWidget([
            'id' => 'code2-button',
            'name' => 'Button',
            'category' => 'ui',
            'description' => 'Clickable button with variants',
            'react_component' => 'Button',
            'icon' => 'button',
            'default_props' => [
                'text' => 'Click me',
                'variant' => 'primary',
                'size' => 'md',
            ],
            'editable_fields' => ['text', 'variant', 'size'],
        ]);

        $this->registerWidget([
            'id' => 'code2-modal',
            'name' => 'Modal Dialog',
            'category' => 'ui',
            'description' => 'Modal popup with header, content, footer',
            'react_component' => 'Modal',
            'icon' => 'modal',
            'default_props' => [
                'title' => 'Modal Title',
                'open' => false,
                'size' => 'md',
            ],
            'editable_fields' => ['title', 'size'],
        ]);

        $this->registerWidget([
            'id' => 'code2-tabs',
            'name' => 'Tabs',
            'category' => 'ui',
            'description' => 'Tabbed content panel',
            'react_component' => 'Tabs',
            'icon' => 'tabs',
            'default_props' => [
                'tabs' => [],
                'default_active' => 0,
            ],
            'editable_fields' => ['tabs'],
        ]);

        $this->registerWidget([
            'id' => 'code2-tooltip',
            'name' => 'Tooltip',
            'category' => 'ui',
            'description' => 'Hover tooltip text',
            'react_component' => 'Tooltip',
            'icon' => 'tooltip',
            'default_props' => [
                'content' => 'Tooltip text',
                'position' => 'top',
            ],
            'editable_fields' => ['content', 'position'],
        ]);

        // NATIVE TITANBUILDER WIDGETS
        $this->registerWidget([
            'id' => 'native-text-block',
            'name' => 'Text Block',
            'category' => 'content',
            'description' => 'Rich text content block',
            'component_type' => 'native',
            'icon' => 'text',
            'default_props' => [
                'content' => 'Enter text...',
                'alignment' => 'left',
            ],
            'editable_fields' => ['content', 'alignment'],
        ]);

        $this->registerWidget([
            'id' => 'native-image',
            'name' => 'Image',
            'category' => 'media',
            'description' => 'Image with optional caption',
            'component_type' => 'native',
            'icon' => 'image',
            'default_props' => [
                'src' => '',
                'alt' => 'Image',
                'width' => '100%',
            ],
            'editable_fields' => ['src', 'alt', 'width'],
        ]);

        $this->registerWidget([
            'id' => 'native-spacer',
            'name' => 'Spacer',
            'category' => 'layout',
            'description' => 'Vertical spacing element',
            'component_type' => 'native',
            'icon' => 'spacer',
            'default_props' => [
                'height' => '20px',
            ],
            'editable_fields' => ['height'],
        ]);

        $this->registerWidget([
            'id' => 'native-divider',
            'name' => 'Divider',
            'category' => 'layout',
            'description' => 'Horizontal divider line',
            'component_type' => 'native',
            'icon' => 'divider',
            'default_props' => [
                'style' => 'solid',
                'color' => '#ccc',
            ],
            'editable_fields' => ['style', 'color'],
        ]);
    }

    /**
     * Initialize template registry with predefined dashboards
     */
    private function initializeTemplateRegistry(): void
    {
        // Code 2.0 templates
        $templates = [
            'home-dashboard' => [
                'name' => 'Home Dashboard',
                'description' => 'Overview dashboard with balance, products, customers',
                'category' => 'commerce',
                'widgets' => [
                    ['id' => 'code2-stat-card', 'position' => [0, 0, 3, 1], 'props' => ['label' => 'Total Revenue']],
                    ['id' => 'code2-stat-card', 'position' => [3, 0, 3, 1], 'props' => ['label' => 'Total Orders']],
                    ['id' => 'code2-stat-card', 'position' => [6, 0, 3, 1], 'props' => ['label' => 'Total Customers']],
                    ['id' => 'code2-chart-balance', 'position' => [0, 1, 6, 3], 'props' => []],
                    ['id' => 'code2-popular-products', 'position' => [6, 1, 3, 3], 'props' => []],
                ],
            ],
            'products-dashboard' => [
                'name' => 'Products Dashboard',
                'description' => 'Product inventory and sales tracking',
                'category' => 'ecommerce',
                'widgets' => [
                    ['id' => 'code2-grid-product', 'position' => [0, 0, 9, 4], 'props' => []],
                    ['id' => 'code2-popular-products', 'position' => [0, 4, 9, 2], 'props' => []],
                ],
            ],
            'customers-dashboard' => [
                'name' => 'Customers Dashboard',
                'description' => 'Customer management and analytics',
                'category' => 'crm',
                'widgets' => [
                    ['id' => 'code2-table', 'position' => [0, 0, 9, 4], 'props' => ['title' => 'Customers']],
                    ['id' => 'code2-stat-card', 'position' => [0, 4, 3, 1], 'props' => ['label' => 'Total Customers']],
                    ['id' => 'code2-stat-card', 'position' => [3, 4, 3, 1], 'props' => ['label' => 'New This Month']],
                    ['id' => 'code2-stat-card', 'position' => [6, 4, 3, 1], 'props' => ['label' => 'Retention Rate']],
                ],
            ],
        ];

        foreach ($templates as $id => $template) {
            $this->registerTemplate($id, $template);
        }
    }

    /**
     * Register a widget in the registry
     */
    public function registerWidget(array $widget): void
    {
        if (empty($widget['id'])) {
            throw new InvalidArgumentException('Widget must have an id');
        }
        $this->widgetRegistry[$widget['id']] = array_merge($widget, [
            'registered_at' => now()->toIso8601String(),
        ]);
    }

    /**
     * Register a template
     */
    public function registerTemplate(string $id, array $template): void
    {
        $this->templateRegistry[$id] = array_merge($template, [
            'id' => $id,
            'registered_at' => now()->toIso8601String(),
        ]);
    }

    /**
     * Get a widget by ID
     */
    public function getWidget(string $id): ?array
    {
        return $this->widgetRegistry[$id] ?? null;
    }

    /**
     * Get all widgets, optionally filtered by category
     */
    public function getWidgets(?string $category = null): array
    {
        if ($category) {
            return array_filter($this->widgetRegistry, fn($w) => ($w['category'] ?? null) === $category);
        }
        return $this->widgetRegistry;
    }

    /**
     * Get widget library for GrapesJS editor
     */
    public function getGrapesJsBlockLibrary(): array
    {
        $blocks = [];

        foreach ($this->widgetRegistry as $widget) {
            $blocks[] = [
                'id' => $widget['id'],
                'label' => $widget['name'] ?? 'Widget',
                'content' => [
                    'type' => $widget['react_component'] ?? $widget['component_type'] ?? 'div',
                    'attributes' => ['data-widget-id' => $widget['id']],
                    'style' => $widget['default_style'] ?? [],
                ],
                'category' => $widget['category'] ?? 'default',
                'attributes' => [
                    'class' => 'gjs-block-' . ($widget['category'] ?? 'default'),
                    'title' => $widget['description'] ?? '',
                ],
            ];
        }

        return $blocks;
    }

    /**
     * Get a template by ID
     */
    public function getTemplate(string $id): ?array
    {
        return $this->templateRegistry[$id] ?? null;
    }

    /**
     * Get all templates, optionally filtered by category
     */
    public function getTemplates(?string $category = null): array
    {
        if ($category) {
            return array_filter($this->templateRegistry, fn($t) => ($t['category'] ?? null) === $category);
        }
        return $this->templateRegistry;
    }

    /**
     * Create dashboard from template
     */
    public function createDashboardFromTemplate(string $templateId, array $customizations = []): array
    {
        $template = $this->getTemplate($templateId);
        if (!$template) {
            throw new InvalidArgumentException("Template '{$templateId}' not found");
        }

        $spec = [
            'version' => '1.1',
            'surface' => 'dashboard',
            'template' => $templateId,
            'type' => 'code2-dashboard',
            'components' => [],
            'metadata' => [
                'created_from_template' => $templateId,
                'created_at' => now()->toIso8601String(),
            ],
        ];

        // Add widgets from template
        foreach ($template['widgets'] ?? [] as $widget) {
            $spec['components'][] = array_merge($widget, $customizations[$widget['id']] ?? []);
        }

        return $spec;
    }

    /**
     * Validate dashboard spec
     */
    public function validateSpec(array $spec): array
    {
        $issues = [];

        // Check required fields
        if (empty($spec['version'])) {
            $issues[] = 'Missing required field: version';
        }
        if (empty($spec['surface'])) {
            $issues[] = 'Missing required field: surface';
        }

        // Validate components
        if (isset($spec['components']) && is_array($spec['components'])) {
            foreach ($spec['components'] as $index => $component) {
                if (empty($component['id'])) {
                    $issues[] = "Component at index {$index}: missing id";
                }

                $widgetId = $component['id'] ?? null;
                if ($widgetId && !$this->getWidget($widgetId)) {
                    $issues[] = "Component at index {$index}: unknown widget '{$widgetId}'";
                }
            }
        }

        return [
            'valid' => empty($issues),
            'issues' => $issues,
            'spec' => $spec,
        ];
    }

    /**
     * Export widget registry as JSON for frontend
     */
    public function exportWidgetRegistry(): array
    {
        return [
            'version' => '1.0',
            'widgets' => array_values($this->widgetRegistry),
            'categories' => $this->getWidgetCategories(),
            'stats' => [
                'total_widgets' => count($this->widgetRegistry),
                'code2_widgets' => count(array_filter($this->widgetRegistry, fn($w) => str_starts_with($w['id'], 'code2-'))),
                'native_widgets' => count(array_filter($this->widgetRegistry, fn($w) => str_starts_with($w['id'], 'native-'))),
            ],
        ];
    }

    /**
     * Get unique widget categories
     */
    private function getWidgetCategories(): array
    {
        $categories = [];
        foreach ($this->widgetRegistry as $widget) {
            $category = $widget['category'] ?? 'default';
            if (!in_array($category, $categories)) {
                $categories[] = $category;
            }
        }
        return sort($categories) ? $categories : [];
    }

    /**
     * Generate checksum for dashboard spec
     */
    public function generateChecksum(array $spec): string
    {
        return CanonicalJson::checksum($spec);
    }
}
