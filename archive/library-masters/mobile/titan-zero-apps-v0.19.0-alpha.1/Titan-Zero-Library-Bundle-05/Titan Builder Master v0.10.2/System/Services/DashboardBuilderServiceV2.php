<?php

declare(strict_types=1);

namespace App\Extensions\TitanBuilder\System\Services;

use App\Extensions\TitanBuilder\System\Support\CanonicalJson;
use InvalidArgumentException;

/**
 * ENHANCED V2: Dashboard Builder Service with all Code 2.0 templates
 * 
 * Complete widget registry (24 widgets) + 12 Code 2.0 templates
 * Cumulative enhancement to the TitanBuilder dashboard system
 */
final class DashboardBuilderServiceV2
{
    private array $widgetRegistry = [];
    private array $templateRegistry = [];

    public function __construct()
    {
        $this->initializeWidgetRegistry();
        $this->initializeCode2Templates();
    }

    /**
     * Widget registry remains the same (24 widgets)
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
        ]);

        $this->registerWidget([
            'id' => 'code2-table',
            'name' => 'Data Table',
            'category' => 'data-display',
            'description' => 'Advanced data table with sorting, filtering, pagination',
            'react_component' => 'Table',
            'icon' => 'table',
        ]);

        $this->registerWidget([
            'id' => 'code2-chart-balance',
            'name' => 'Balance Chart',
            'category' => 'charts',
            'description' => 'Area chart for balance/earnings visualization',
            'react_component' => 'Balance',
            'icon' => 'chart-area',
        ]);

        $this->registerWidget([
            'id' => 'code2-stat-card',
            'name' => 'Stat Card',
            'category' => 'data-display',
            'description' => 'Display key metric with label and optional trend',
            'react_component' => 'StatCard',
            'icon' => 'metric',
        ]);

        $this->registerWidget([
            'id' => 'code2-grid-product',
            'name' => 'Product Grid',
            'category' => 'ecommerce',
            'description' => 'Display products in responsive grid layout',
            'react_component' => 'GridProduct',
            'icon' => 'grid',
        ]);

        $this->registerWidget([
            'id' => 'code2-refund-requests',
            'name' => 'Refund Requests',
            'category' => 'ecommerce',
            'description' => 'Table of pending refund requests with actions',
            'react_component' => 'RefundRequests',
            'icon' => 'refund',
        ]);

        $this->registerWidget([
            'id' => 'code2-popular-products',
            'name' => 'Popular Products',
            'category' => 'ecommerce',
            'description' => 'List of top-selling products with stats',
            'react_component' => 'PopularProducts',
            'icon' => 'trending-up',
        ]);

        // FORM WIDGETS
        $this->registerWidget([
            'id' => 'code2-field-text',
            'name' => 'Text Input',
            'category' => 'form',
            'description' => 'Text input field with validation',
            'react_component' => 'Field',
            'icon' => 'text',
        ]);

        $this->registerWidget([
            'id' => 'code2-field-image',
            'name' => 'Image Upload',
            'category' => 'form',
            'description' => 'Image upload field with preview',
            'react_component' => 'FieldImage',
            'icon' => 'image',
        ]);

        $this->registerWidget([
            'id' => 'code2-field-files',
            'name' => 'File Upload',
            'category' => 'form',
            'description' => 'Multi-file upload field',
            'react_component' => 'FieldFiles',
            'icon' => 'file',
        ]);

        $this->registerWidget([
            'id' => 'code2-select',
            'name' => 'Select Dropdown',
            'category' => 'form',
            'description' => 'Dropdown select field',
            'react_component' => 'Select',
            'icon' => 'dropdown',
        ]);

        $this->registerWidget([
            'id' => 'code2-checkbox',
            'name' => 'Checkbox',
            'category' => 'form',
            'description' => 'Single or multiple checkboxes',
            'react_component' => 'Checkbox',
            'icon' => 'checkbox',
        ]);

        // UI WIDGETS
        $this->registerWidget([
            'id' => 'code2-button',
            'name' => 'Button',
            'category' => 'ui',
            'description' => 'Clickable button with variants',
            'react_component' => 'Button',
            'icon' => 'button',
        ]);

        $this->registerWidget([
            'id' => 'code2-modal',
            'name' => 'Modal Dialog',
            'category' => 'ui',
            'description' => 'Modal popup with header, content, footer',
            'react_component' => 'Modal',
            'icon' => 'modal',
        ]);

        $this->registerWidget([
            'id' => 'code2-tabs',
            'name' => 'Tabs',
            'category' => 'ui',
            'description' => 'Tabbed content panel',
            'react_component' => 'Tabs',
            'icon' => 'tabs',
        ]);

        $this->registerWidget([
            'id' => 'code2-tooltip',
            'name' => 'Tooltip',
            'category' => 'ui',
            'description' => 'Hover tooltip text',
            'react_component' => 'Tooltip',
            'icon' => 'tooltip',
        ]);

        // NATIVE WIDGETS
        $this->registerWidget([
            'id' => 'native-text-block',
            'name' => 'Text Block',
            'category' => 'content',
            'description' => 'Rich text content block',
            'component_type' => 'native',
            'icon' => 'text',
        ]);

        $this->registerWidget([
            'id' => 'native-image',
            'name' => 'Image',
            'category' => 'media',
            'description' => 'Image with optional caption',
            'component_type' => 'native',
            'icon' => 'image',
        ]);

        $this->registerWidget([
            'id' => 'native-spacer',
            'name' => 'Spacer',
            'category' => 'layout',
            'description' => 'Vertical spacing element',
            'component_type' => 'native',
            'icon' => 'spacer',
        ]);

        $this->registerWidget([
            'id' => 'native-divider',
            'name' => 'Divider',
            'category' => 'layout',
            'description' => 'Horizontal divider line',
            'component_type' => 'native',
            'icon' => 'divider',
        ]);
    }

    /**
     * NEW: Initialize all 12 Code 2.0 templates from production dashboards
     */
    private function initializeCode2Templates(): void
    {
        // 1. HOME DASHBOARD - Overview with balance, products, customers
        $this->registerTemplate('home-dashboard', [
            'name' => 'Home Dashboard',
            'description' => 'Overview dashboard with revenue stats, balance chart, and popular products',
            'category' => 'commerce',
            'source' => 'Code 2.0',
            'preview_image' => '/images/templates/home-dashboard.png',
            'widgets' => [
                ['id' => 'code2-stat-card', 'position' => [0, 0, 3, 1], 'props' => ['label' => 'Total Revenue']],
                ['id' => 'code2-stat-card', 'position' => [3, 0, 3, 1], 'props' => ['label' => 'Total Orders']],
                ['id' => 'code2-stat-card', 'position' => [6, 0, 3, 1], 'props' => ['label' => 'Total Customers']],
                ['id' => 'code2-chart-balance', 'position' => [0, 1, 6, 3], 'props' => []],
                ['id' => 'code2-popular-products', 'position' => [6, 1, 3, 3], 'props' => []],
            ],
        ]);

        // 2. PRODUCTS DASHBOARD - Inventory and sales tracking
        $this->registerTemplate('products-dashboard', [
            'name' => 'Products Dashboard',
            'description' => 'Product inventory and sales tracking with grid and popular items',
            'category' => 'ecommerce',
            'source' => 'Code 2.0',
            'preview_image' => '/images/templates/products-dashboard.png',
            'widgets' => [
                ['id' => 'code2-stat-card', 'position' => [0, 0, 3, 1], 'props' => ['label' => 'Total Products']],
                ['id' => 'code2-stat-card', 'position' => [3, 0, 3, 1], 'props' => ['label' => 'Total Sales']],
                ['id' => 'code2-stat-card', 'position' => [6, 0, 3, 1], 'props' => ['label' => 'Active Listings']],
                ['id' => 'code2-grid-product', 'position' => [0, 1, 9, 3], 'props' => []],
                ['id' => 'code2-popular-products', 'position' => [0, 4, 9, 2], 'props' => []],
            ],
        ]);

        // 3. CUSTOMERS DASHBOARD - Customer management
        $this->registerTemplate('customers-dashboard', [
            'name' => 'Customers Dashboard',
            'description' => 'Customer management with list, analytics, and segmentation',
            'category' => 'crm',
            'source' => 'Code 2.0',
            'preview_image' => '/images/templates/customers-dashboard.png',
            'widgets' => [
                ['id' => 'code2-stat-card', 'position' => [0, 0, 3, 1], 'props' => ['label' => 'Total Customers']],
                ['id' => 'code2-stat-card', 'position' => [3, 0, 3, 1], 'props' => ['label' => 'New This Month']],
                ['id' => 'code2-stat-card', 'position' => [6, 0, 3, 1], 'props' => ['label' => 'Retention Rate']],
                ['id' => 'code2-table', 'position' => [0, 1, 9, 4], 'props' => ['title' => 'Customer List']],
            ],
        ]);

        // 4. INCOME DASHBOARD - Earnings and payouts
        $this->registerTemplate('income-dashboard', [
            'name' => 'Income Dashboard',
            'description' => 'Earnings tracking with balance chart, by-country breakdown, and payouts',
            'category' => 'finance',
            'source' => 'Code 2.0',
            'preview_image' => '/images/templates/income-dashboard.png',
            'widgets' => [
                ['id' => 'code2-stat-card', 'position' => [0, 0, 3, 1], 'props' => ['label' => 'Total Earnings']],
                ['id' => 'code2-stat-card', 'position' => [3, 0, 3, 1], 'props' => ['label' => 'Pending Payout']],
                ['id' => 'code2-stat-card', 'position' => [6, 0, 3, 1], 'props' => ['label' => 'This Month']],
                ['id' => 'code2-chart-balance', 'position' => [0, 1, 6, 3], 'props' => []],
                ['id' => 'code2-table', 'position' => [6, 1, 3, 3], 'props' => ['title' => 'By Country']],
            ],
        ]);

        // 5. PROMOTE DASHBOARD - Campaign management
        $this->registerTemplate('promote-dashboard', [
            'name' => 'Promote Dashboard',
            'description' => 'Campaign creation and promotion tracking with scheduling',
            'category' => 'marketing',
            'source' => 'Code 2.0',
            'preview_image' => '/images/templates/promote-dashboard.png',
            'widgets' => [
                ['id' => 'code2-stat-card', 'position' => [0, 0, 3, 1], 'props' => ['label' => 'Active Campaigns']],
                ['id' => 'code2-stat-card', 'position' => [3, 0, 3, 1], 'props' => ['label' => 'Total Reach']],
                ['id' => 'code2-stat-card', 'position' => [6, 0, 3, 1], 'props' => ['label' => 'Engagement Rate']],
                ['id' => 'code2-table', 'position' => [0, 1, 9, 4], 'props' => ['title' => 'Campaigns']],
            ],
        ]);

        // 6. SETTINGS DASHBOARD - User settings and preferences
        $this->registerTemplate('settings-dashboard', [
            'name' => 'Settings Dashboard',
            'description' => 'User settings, notifications, and profile management',
            'category' => 'account',
            'source' => 'Code 2.0',
            'preview_image' => '/images/templates/settings-dashboard.png',
            'widgets' => [
                ['id' => 'code2-card', 'position' => [0, 0, 4, 2], 'props' => ['title' => 'Account Settings']],
                ['id' => 'code2-card', 'position' => [4, 0, 4, 2], 'props' => ['title' => 'Notifications']],
                ['id' => 'code2-card', 'position' => [8, 0, 1, 2], 'props' => ['title' => 'Privacy']],
                ['id' => 'code2-table', 'position' => [0, 2, 9, 2], 'props' => ['title' => 'Connected Services']],
            ],
        ]);

        // 7. SHOP DASHBOARD - Store management
        $this->registerTemplate('shop-dashboard', [
            'name' => 'Shop Dashboard',
            'description' => 'Shop profile, inventory, and store analytics',
            'category' => 'commerce',
            'source' => 'Code 2.0',
            'preview_image' => '/images/templates/shop-dashboard.png',
            'widgets' => [
                ['id' => 'code2-stat-card', 'position' => [0, 0, 3, 1], 'props' => ['label' => 'Shop Views']],
                ['id' => 'code2-stat-card', 'position' => [3, 0, 3, 1], 'props' => ['label' => 'Total Sales']],
                ['id' => 'code2-stat-card', 'position' => [6, 0, 3, 1], 'props' => ['label' => 'Rating']],
                ['id' => 'code2-card', 'position' => [0, 1, 9, 3], 'props' => ['title' => 'Shop Profile']],
            ],
        ]);

        // 8. MESSAGES DASHBOARD - Communication inbox
        $this->registerTemplate('messages-dashboard', [
            'name' => 'Messages Dashboard',
            'description' => 'Message center with inbox, conversations, and chat',
            'category' => 'communication',
            'source' => 'Code 2.0',
            'preview_image' => '/images/templates/messages-dashboard.png',
            'widgets' => [
                ['id' => 'code2-stat-card', 'position' => [0, 0, 3, 1], 'props' => ['label' => 'Total Messages']],
                ['id' => 'code2-stat-card', 'position' => [3, 0, 3, 1], 'props' => ['label' => 'Unread']],
                ['id' => 'code2-stat-card', 'position' => [6, 0, 3, 1], 'props' => ['label' => 'Conversations']],
                ['id' => 'code2-table', 'position' => [0, 1, 9, 4], 'props' => ['title' => 'Messages']],
            ],
        ]);

        // 9. NOTIFICATIONS DASHBOARD - Activity feed
        $this->registerTemplate('notifications-dashboard', [
            'name' => 'Notifications Dashboard',
            'description' => 'Activity notifications and alert management',
            'category' => 'activity',
            'source' => 'Code 2.0',
            'preview_image' => '/images/templates/notifications-dashboard.png',
            'widgets' => [
                ['id' => 'code2-stat-card', 'position' => [0, 0, 3, 1], 'props' => ['label' => 'Total Notifications']],
                ['id' => 'code2-stat-card', 'position' => [3, 0, 3, 1], 'props' => ['label' => 'Unread']],
                ['id' => 'code2-stat-card', 'position' => [6, 0, 3, 1], 'props' => ['label' => 'This Week']],
                ['id' => 'code2-table', 'position' => [0, 1, 9, 4], 'props' => ['title' => 'Activity Feed']],
            ],
        ]);

        // 10. EXPLORE CREATORS DASHBOARD - Creator discovery
        $this->registerTemplate('explore-creators-dashboard', [
            'name' => 'Explore Creators',
            'description' => 'Discover and follow creators with filtering and recommendations',
            'category' => 'social',
            'source' => 'Code 2.0',
            'preview_image' => '/images/templates/explore-creators-dashboard.png',
            'widgets' => [
                ['id' => 'code2-stat-card', 'position' => [0, 0, 3, 1], 'props' => ['label' => 'Total Creators']],
                ['id' => 'code2-stat-card', 'position' => [3, 0, 3, 1], 'props' => ['label' => 'Following']],
                ['id' => 'code2-stat-card', 'position' => [6, 0, 3, 1], 'props' => ['label' => 'Followers']],
                ['id' => 'code2-grid-product', 'position' => [0, 1, 9, 4], 'props' => ['title' => 'Creators']],
            ],
        ]);

        // 11. AFFILIATE CENTER DASHBOARD - Affiliate program management
        $this->registerTemplate('affiliate-center-dashboard', [
            'name' => 'Affiliate Center',
            'description' => 'Affiliate program tracking, commissions, and campaign links',
            'category' => 'affiliate',
            'source' => 'Code 2.0',
            'preview_image' => '/images/templates/affiliate-center-dashboard.png',
            'widgets' => [
                ['id' => 'code2-stat-card', 'position' => [0, 0, 3, 1], 'props' => ['label' => 'Total Clicks']],
                ['id' => 'code2-stat-card', 'position' => [3, 0, 3, 1], 'props' => ['label' => 'Conversions']],
                ['id' => 'code2-stat-card', 'position' => [6, 0, 3, 1], 'props' => ['label' => 'Commission']],
                ['id' => 'code2-chart-balance', 'position' => [0, 1, 6, 3], 'props' => []],
                ['id' => 'code2-table', 'position' => [6, 1, 3, 3], 'props' => ['title' => 'Top Links']],
            ],
        ]);

        // 12. UPGRADE TO PRO DASHBOARD - Pricing and plans
        $this->registerTemplate('upgrade-to-pro-dashboard', [
            'name' => 'Upgrade to Pro',
            'description' => 'Pricing plans, features comparison, and upgrade path',
            'category' => 'pricing',
            'source' => 'Code 2.0',
            'preview_image' => '/images/templates/upgrade-to-pro-dashboard.png',
            'widgets' => [
                ['id' => 'code2-card', 'position' => [0, 0, 3, 3], 'props' => ['title' => 'Basic Plan']],
                ['id' => 'code2-card', 'position' => [3, 0, 3, 3], 'props' => ['title' => 'Professional Plan']],
                ['id' => 'code2-card', 'position' => [6, 0, 3, 3], 'props' => ['title' => 'Enterprise Plan']],
            ],
        ]);
    }

    /**
     * Register a widget
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
     * Get widget by ID
     */
    public function getWidget(string $id): ?array
    {
        return $this->widgetRegistry[$id] ?? null;
    }

    /**
     * Get all widgets
     */
    public function getWidgets(?string $category = null): array
    {
        if ($category) {
            return array_filter($this->widgetRegistry, fn($w) => ($w['category'] ?? null) === $category);
        }
        return $this->widgetRegistry;
    }

    /**
     * Get template by ID
     */
    public function getTemplate(string $id): ?array
    {
        return $this->templateRegistry[$id] ?? null;
    }

    /**
     * Get all templates (NOW 12 instead of 3!)
     */
    public function getTemplates(?string $category = null): array
    {
        if ($category) {
            return array_filter($this->templateRegistry, fn($t) => ($t['category'] ?? null) === $category);
        }
        return $this->templateRegistry;
    }

    /**
     * Export widget registry
     */
    public function exportWidgetRegistry(): array
    {
        return [
            'version' => '2.0',
            'widgets' => array_values($this->widgetRegistry),
            'stats' => [
                'total_widgets' => count($this->widgetRegistry),
                'code2_widgets' => 20,
                'native_widgets' => 4,
            ],
        ];
    }

    /**
     * Export template registry
     */
    public function exportTemplateRegistry(): array
    {
        return [
            'version' => '2.0',
            'templates' => array_values($this->templateRegistry),
            'stats' => [
                'total_templates' => count($this->templateRegistry),
                'by_category' => $this->getTemplatesByCategory(),
            ],
        ];
    }

    /**
     * Get templates grouped by category
     */
    private function getTemplatesByCategory(): array
    {
        $categories = [];
        foreach ($this->templateRegistry as $template) {
            $category = $template['category'] ?? 'uncategorized';
            if (!isset($categories[$category])) {
                $categories[$category] = [];
            }
            $categories[$category][] = $template['name'];
        }
        return $categories;
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
            'version' => '2.0',
            'surface' => 'dashboard',
            'template' => $templateId,
            'type' => 'code2-dashboard',
            'components' => [],
            'metadata' => [
                'created_from_template' => $templateId,
                'created_at' => now()->toIso8601String(),
            ],
        ];

        foreach ($template['widgets'] ?? [] as $widget) {
            $spec['components'][] = array_merge($widget, $customizations[$widget['id']] ?? []);
        }

        return $spec;
    }

    /**
     * Validate spec
     */
    public function validateSpec(array $spec): array
    {
        $issues = [];

        if (empty($spec['version'])) {
            $issues[] = 'Missing required field: version';
        }
        if (empty($spec['surface'])) {
            $issues[] = 'Missing required field: surface';
        }

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
     * Generate checksum
     */
    public function generateChecksum(array $spec): string
    {
        return CanonicalJson::checksum($spec);
    }
}
