<?php

declare(strict_types=1);

namespace App\Extensions\TitanBuilder\System\Services;

use App\Extensions\TitanBuilder\System\Support\CanonicalJson;
use InvalidArgumentException;

/**
 * TitanZero Dashboard Builder Service
 * 
 * Field-service and AI-governance-specific dashboards
 * Pre-configured for:
 * - Cleaning, HVAC, Plumbing, Electrical, Landscaping services
 * - Multi-app ecosystem (Hub, Go, Core, BOS, Pay, Gear)
 * - Five-tier AI governance hierarchy
 * - Offline-first architecture (LocalBrain)
 * - Real-time field operations
 */
final class TitanZeroDashboardService
{
    private array $widgetRegistry = [];
    private array $templateRegistry = [];

    public function __construct()
    {
        $this->initializeTitanZeroWidgets();
        $this->initializeTitanZeroTemplates();
    }

    /**
     * TitanZero-specific widgets for field service operations
     */
    private function initializeTitanZeroWidgets(): void
    {
        // FIELD SERVICE WIDGETS
        $this->registerWidget([
            'id' => 'titan-job-card',
            'name' => 'Active Job Card',
            'category' => 'field-service',
            'description' => 'Display active job with technician, customer, status, ETA',
            'icon' => 'briefcase',
            'props' => ['job_id', 'status', 'eta', 'technician', 'customer'],
        ]);

        $this->registerWidget([
            'id' => 'titan-job-list',
            'name' => 'Job List/Queue',
            'category' => 'field-service',
            'description' => 'List of pending, active, completed jobs with filtering',
            'icon' => 'list',
            'props' => ['filter_status', 'sort_by', 'date_range'],
        ]);

        $this->registerWidget([
            'id' => 'titan-team-dispatch',
            'name' => 'Team Dispatch Map',
            'category' => 'field-service',
            'description' => 'Real-time map of team members, jobs, and routing',
            'icon' => 'map',
            'props' => ['show_routes', 'show_eta', 'center_location'],
        ]);

        $this->registerWidget([
            'id' => 'titan-technician-status',
            'name' => 'Technician Status',
            'category' => 'field-service',
            'description' => 'Current status, availability, performance metrics',
            'icon' => 'user-check',
            'props' => ['technician_id', 'show_metrics'],
        ]);

        $this->registerWidget([
            'id' => 'titan-customer-profile',
            'name' => 'Customer Profile Card',
            'category' => 'customer',
            'description' => 'Customer info, service history, ratings, preferences',
            'icon' => 'user-circle',
            'props' => ['customer_id', 'show_history', 'show_ratings'],
        ]);

        $this->registerWidget([
            'id' => 'titan-service-quality',
            'name' => 'Service Quality Score',
            'category' => 'quality',
            'description' => 'Real-time quality metrics, photo verification, completion rate',
            'icon' => 'star',
            'props' => ['period', 'metric_type'],
        ]);

        $this->registerWidget([
            'id' => 'titan-revenue-pipeline',
            'name' => 'Revenue Pipeline',
            'category' => 'finance',
            'description' => 'Pending invoices, completed services, payment status',
            'icon' => 'dollar-sign',
            'props' => ['period', 'sort_by'],
        ]);

        $this->registerWidget([
            'id' => 'titan-ai-decision',
            'name' => 'AI Decision Log',
            'category' => 'ai-governance',
            'description' => 'Model Council decisions, Risk Engine alerts, autonomy level changes',
            'icon' => 'cpu',
            'props' => ['decision_type', 'confidence_level'],
        ]);

        $this->registerWidget([
            'id' => 'titan-risk-gauge',
            'name' => 'Risk Engine Gauge',
            'category' => 'ai-governance',
            'description' => 'Real-time risk score, anomalies, escalations',
            'icon' => 'alert-triangle',
            'props' => ['risk_level', 'show_details'],
        ]);

        $this->registerWidget([
            'id' => 'titan-autonomy-level',
            'name' => 'Autonomy Level Meter',
            'category' => 'ai-governance',
            'description' => 'Five-tier AI autonomy (Uno→Quattro), capability unlocks',
            'icon' => 'zap',
            'props' => ['show_capabilities'],
        ]);

        $this->registerWidget([
            'id' => 'titan-offline-sync',
            'name' => 'Offline Sync Status',
            'category' => 'system',
            'description' => 'LocalBrain sync, pending uploads, device status',
            'icon' => 'wifi-off',
            'props' => ['show_details'],
        ]);

        $this->registerWidget([
            'id' => 'titan-command-bus-log',
            'name' => 'Command Bus Activity',
            'category' => 'system',
            'description' => 'Real-time command execution, queued tasks, failures',
            'icon' => 'terminal',
            'props' => ['show_errors', 'filter_type'],
        ]);

        $this->registerWidget([
            'id' => 'titan-voice-agent',
            'name' => 'Voice Agent Status',
            'category' => 'system',
            'description' => 'Voice-first UX interaction logs, spoken commands, responses',
            'icon' => 'mic',
            'props' => ['show_transcripts'],
        ]);

        $this->registerWidget([
            'id' => 'titan-tenant-isolation',
            'name' => 'Tenant Isolation Check',
            'category' => 'security',
            'description' => 'Multi-tenant data isolation status, cross-tenant risks',
            'icon' => 'shield',
            'props' => ['show_warnings'],
        ]);

        // Add standard widgets for compatibility
        $this->registerWidget([
            'id' => 'standard-stat-card',
            'name' => 'Stat Card',
            'category' => 'display',
            'description' => 'Display metric with number and label',
            'icon' => 'metric',
        ]);

        $this->registerWidget([
            'id' => 'standard-chart',
            'name' => 'Chart',
            'category' => 'charts',
            'description' => 'Line, bar, or area chart',
            'icon' => 'chart-line',
        ]);

        $this->registerWidget([
            'id' => 'standard-table',
            'name' => 'Data Table',
            'category' => 'display',
            'description' => 'Sortable, filterable data table',
            'icon' => 'table',
        ]);

        $this->registerWidget([
            'id' => 'standard-button',
            'name' => 'Action Button',
            'category' => 'interaction',
            'description' => 'Clickable button for actions',
            'icon' => 'button',
        ]);
    }

    /**
     * TitanZero-specific dashboard templates
     * Pre-wired for field service operations and AI governance
     */
    private function initializeTitanZeroTemplates(): void
    {
        // === FIELD SERVICE DASHBOARDS (for dispatch and management) ===

        // 1. DISPATCH DASHBOARD - Real-time field operations
        $this->registerTemplate('titan-dispatch-dashboard', [
            'name' => 'Dispatch Center',
            'description' => 'Real-time job dispatch, team location, active jobs, routing',
            'category' => 'field-service',
            'vertical' => 'all',
            'icon' => 'zap',
            'widgets' => [
                ['id' => 'titan-team-dispatch', 'position' => [0, 0, 6, 4], 'props' => ['show_routes' => true]],
                ['id' => 'titan-job-list', 'position' => [6, 0, 3, 4], 'props' => ['filter_status' => 'active']],
                ['id' => 'standard-stat-card', 'position' => [6, 4, 1.5, 1], 'props' => ['label' => 'Active Jobs']],
                ['id' => 'standard-stat-card', 'position' => [7.5, 4, 1.5, 1], 'props' => ['label' => 'Technicians on Duty']],
            ],
        ]);

        // 2. TECHNICIAN DASHBOARD - Personal job queue (Titan Go)
        $this->registerTemplate('titan-technician-dashboard', [
            'name' => 'Technician Mobile Dashboard',
            'description' => 'Personal job queue, current job details, navigation, completion',
            'category' => 'field-service',
            'vertical' => 'all',
            'mobile_first' => true,
            'icon' => 'smartphone',
            'widgets' => [
                ['id' => 'titan-job-card', 'position' => [0, 0, 9, 2], 'props' => ['status' => 'current']],
                ['id' => 'titan-job-list', 'position' => [0, 2, 9, 3], 'props' => ['filter_status' => 'queued']],
                ['id' => 'titan-offline-sync', 'position' => [0, 5, 9, 1], 'props' => []],
            ],
        ]);

        // 3. CUSTOMER MANAGEMENT DASHBOARD
        $this->registerTemplate('titan-customer-management-dashboard', [
            'name' => 'Customer Management',
            'description' => 'Customer profiles, service history, ratings, retention, next service date',
            'category' => 'customer',
            'vertical' => 'all',
            'icon' => 'users',
            'widgets' => [
                ['id' => 'standard-stat-card', 'position' => [0, 0, 2.25, 1], 'props' => ['label' => 'Total Customers']],
                ['id' => 'standard-stat-card', 'position' => [2.25, 0, 2.25, 1], 'props' => ['label' => 'Active']],
                ['id' => 'standard-stat-card', 'position' => [4.5, 0, 2.25, 1], 'props' => ['label' => 'At Risk']],
                ['id' => 'standard-stat-card', 'position' => [6.75, 0, 2.25, 1], 'props' => ['label' => 'Avg Rating']],
                ['id' => 'standard-table', 'position' => [0, 1, 9, 4], 'props' => ['title' => 'Customer List', 'columns' => ['name', 'status', 'rating', 'last_service', 'next_scheduled']]],
            ],
        ]);

        // 4. SERVICE QUALITY DASHBOARD
        $this->registerTemplate('titan-quality-dashboard', [
            'name' => 'Service Quality & Feedback',
            'description' => 'Quality scores, photo verification completion, customer ratings, net promoter score',
            'category' => 'quality',
            'vertical' => 'cleaning',
            'icon' => 'star',
            'widgets' => [
                ['id' => 'titan-service-quality', 'position' => [0, 0, 3, 2], 'props' => ['period' => 'this_month']],
                ['id' => 'standard-chart', 'position' => [3, 0, 3, 2], 'props' => ['type' => 'line', 'title' => 'Quality Trend']],
                ['id' => 'standard-chart', 'position' => [6, 0, 3, 2], 'props' => ['type' => 'bar', 'title' => 'By Technician']],
                ['id' => 'standard-table', 'position' => [0, 2, 9, 3], 'props' => ['title' => 'Recent Feedback']],
            ],
        ]);

        // 5. REVENUE & BILLING DASHBOARD
        $this->registerTemplate('titan-revenue-dashboard', [
            'name' => 'Revenue & Billing',
            'description' => 'Pending invoices, completed services, payment status, recurring revenue, fee-free payments (ZeroPay)',
            'category' => 'finance',
            'vertical' => 'all',
            'icon' => 'dollar-sign',
            'widgets' => [
                ['id' => 'standard-stat-card', 'position' => [0, 0, 2.25, 1], 'props' => ['label' => 'Total Revenue (30d)']],
                ['id' => 'standard-stat-card', 'position' => [2.25, 0, 2.25, 1], 'props' => ['label' => 'Pending Invoices']],
                ['id' => 'standard-stat-card', 'position' => [4.5, 0, 2.25, 1], 'props' => ['label' => 'Paid This Month']],
                ['id' => 'standard-stat-card', 'position' => [6.75, 0, 2.25, 1], 'props' => ['label' => 'Avg Invoice Value']],
                ['id' => 'standard-chart', 'position' => [0, 1, 4.5, 3], 'props' => ['type' => 'line', 'title' => 'Revenue Trend']],
                ['id' => 'titan-revenue-pipeline', 'position' => [4.5, 1, 4.5, 3], 'props' => []],
            ],
        ]);

        // === AI GOVERNANCE DASHBOARDS ===

        // 6. MODEL COUNCIL DASHBOARD - AI decision making
        $this->registerTemplate('titan-model-council-dashboard', [
            'name' => 'Model Council Dashboard',
            'description' => 'LogiCore → CreatiCore → OmegaCore → OmicronCore → EntropyCore pipeline',
            'category' => 'ai-governance',
            'vertical' => 'all',
            'icon' => 'cpu',
            'widgets' => [
                ['id' => 'standard-stat-card', 'position' => [0, 0, 1.8, 1], 'props' => ['label' => 'Decisions Today']],
                ['id' => 'standard-stat-card', 'position' => [1.8, 0, 1.8, 1], 'props' => ['label' => 'Avg Confidence']],
                ['id' => 'standard-stat-card', 'position' => [3.6, 0, 1.8, 1], 'props' => ['label' => 'Escalations']],
                ['id' => 'standard-stat-card', 'position' => [5.4, 0, 1.8, 1], 'props' => ['label' => 'Override Rate']],
                ['id' => 'standard-stat-card', 'position' => [7.2, 0, 1.8, 1], 'props' => ['label' => 'Avg Latency (ms)']],
                ['id' => 'titan-ai-decision', 'position' => [0, 1, 9, 4], 'props' => ['decision_type' => 'all']],
            ],
        ]);

        // 7. RISK ENGINE DASHBOARD
        $this->registerTemplate('titan-risk-engine-dashboard', [
            'name' => 'Risk Engine & Anomalies',
            'description' => 'Real-time risk scoring, anomaly detection, escalations, Shield governance',
            'category' => 'ai-governance',
            'vertical' => 'all',
            'icon' => 'alert-triangle',
            'widgets' => [
                ['id' => 'titan-risk-gauge', 'position' => [0, 0, 3, 2], 'props' => []],
                ['id' => 'standard-stat-card', 'position' => [3, 0, 2, 1], 'props' => ['label' => 'Active Risks']],
                ['id' => 'standard-stat-card', 'position' => [5, 0, 2, 1], 'props' => ['label' => 'Escalations']],
                ['id' => 'standard-stat-card', 'position' => [7, 0, 2, 1], 'props' => ['label' => 'Anomalies']],
                ['id' => 'standard-table', 'position' => [0, 2, 9, 3], 'props' => ['title' => 'Risk Alert Log']],
            ],
        ]);

        // 8. AUTONOMY & GOVERNANCE DASHBOARD
        $this->registerTemplate('titan-autonomy-dashboard', [
            'name' => 'Autonomy Levels & Capabilities',
            'description' => 'Five-tier AI hierarchy (Uno/Duo/Trio/Quattro), capability unlocks, governance versioning',
            'category' => 'ai-governance',
            'vertical' => 'all',
            'icon' => 'zap',
            'widgets' => [
                ['id' => 'titan-autonomy-level', 'position' => [0, 0, 9, 2], 'props' => ['show_capabilities' => true]],
                ['id' => 'standard-stat-card', 'position' => [0, 2, 2.25, 1], 'props' => ['label' => 'Uno Level']],
                ['id' => 'standard-stat-card', 'position' => [2.25, 2, 2.25, 1], 'props' => ['label' => 'Duo Level']],
                ['id' => 'standard-stat-card', 'position' => [4.5, 2, 2.25, 1], 'props' => ['label' => 'Trio Level']],
                ['id' => 'standard-stat-card', 'position' => [6.75, 2, 2.25, 1], 'props' => ['label' => 'Quattro Level']],
                ['id' => 'standard-table', 'position' => [0, 3, 9, 2], 'props' => ['title' => 'Capability Unlocks']],
            ],
        ]);

        // 9. DECISION LEDGER DASHBOARD
        $this->registerTemplate('titan-decision-ledger-dashboard', [
            'name' => 'Decision Ledger & Governance',
            'description' => 'Immutable decision history, governance versioning, audit trail, command bus execution',
            'category' => 'ai-governance',
            'vertical' => 'all',
            'icon' => 'book',
            'widgets' => [
                ['id' => 'standard-stat-card', 'position' => [0, 0, 2.25, 1], 'props' => ['label' => 'Total Decisions']],
                ['id' => 'standard-stat-card', 'position' => [2.25, 0, 2.25, 1], 'props' => ['label' => 'Governance Ver.']],
                ['id' => 'standard-stat-card', 'position' => [4.5, 0, 2.25, 1], 'props' => ['label' => 'Reversals']],
                ['id' => 'standard-stat-card', 'position' => [6.75, 0, 2.25, 1], 'props' => ['label' => 'Audit Events']],
                ['id' => 'titan-command-bus-log', 'position' => [0, 1, 9, 4], 'props' => []],
            ],
        ]);

        // === SYSTEM & OPERATIONS ===

        // 10. SYSTEM HEALTH DASHBOARD
        $this->registerTemplate('titan-system-health-dashboard', [
            'name' => 'System Health & Sync',
            'description' => 'LocalBrain sync status, offline-first data, command bus health, voice agent activity',
            'category' => 'system',
            'vertical' => 'all',
            'icon' => 'heart',
            'widgets' => [
                ['id' => 'titan-offline-sync', 'position' => [0, 0, 3, 2], 'props' => []],
                ['id' => 'titan-command-bus-log', 'position' => [3, 0, 3, 2], 'props' => ['show_errors' => true]],
                ['id' => 'titan-voice-agent', 'position' => [6, 0, 3, 2], 'props' => []],
                ['id' => 'standard-stat-card', 'position' => [0, 2, 2.25, 1], 'props' => ['label' => 'API Latency']],
                ['id' => 'standard-stat-card', 'position' => [2.25, 2, 2.25, 1], 'props' => ['label' => 'Sync Success %']],
                ['id' => 'standard-stat-card', 'position' => [4.5, 2, 2.25, 1], 'props' => ['label' => 'Queued Commands']],
                ['id' => 'standard-stat-card', 'position' => [6.75, 2, 2.25, 1], 'props' => ['label' => 'Voice Commands/hr']],
                ['id' => 'standard-table', 'position' => [0, 3, 9, 2], 'props' => ['title' => 'Recent Errors']],
            ],
        ]);

        // 11. SECURITY & TENANT ISOLATION
        $this->registerTemplate('titan-security-dashboard', [
            'name' => 'Security & Multi-Tenancy',
            'description' => 'Tenant isolation checks, cross-tenant risks, API key management, Shield alerts',
            'category' => 'security',
            'vertical' => 'all',
            'icon' => 'shield',
            'widgets' => [
                ['id' => 'titan-tenant-isolation', 'position' => [0, 0, 4.5, 2], 'props' => []],
                ['id' => 'standard-stat-card', 'position' => [4.5, 0, 2.25, 1], 'props' => ['label' => 'API Keys']],
                ['id' => 'standard-stat-card', 'position' => [6.75, 0, 2.25, 1], 'props' => ['label' => 'Security Events']],
                ['id' => 'standard-table', 'position' => [0, 2, 9, 3], 'props' => ['title' => 'Access Log']],
            ],
        ]);

        // 12. VERTICAL-SPECIFIC: CLEANING SERVICE DASHBOARD
        $this->registerTemplate('titan-cleaning-dashboard', [
            'name' => 'Cleaning Service Operations',
            'description' => 'Combine dispatch, quality, customer service for cleaning vertical',
            'category' => 'field-service',
            'vertical' => 'cleaning',
            'icon' => 'sparkles',
            'widgets' => [
                ['id' => 'titan-team-dispatch', 'position' => [0, 0, 5, 2], 'props' => []],
                ['id' => 'standard-stat-card', 'position' => [5, 0, 2, 1], 'props' => ['label' => 'Jobs Today']],
                ['id' => 'standard-stat-card', 'position' => [7, 0, 2, 1], 'props' => ['label' => 'Avg Rating']],
                ['id' => 'titan-job-list', 'position' => [0, 2, 4.5, 3], 'props' => []],
                ['id' => 'titan-service-quality', 'position' => [4.5, 2, 4.5, 3], 'props' => []],
            ],
        ]);

        // 13. VERTICAL-SPECIFIC: HVAC/FIELD TECH DASHBOARD
        $this->registerTemplate('titan-field-tech-dashboard', [
            'name' => 'Field Tech Operations (HVAC/Plumbing/Electrical)',
            'description' => 'Job routing, parts inventory, service history, customer relationships',
            'category' => 'field-service',
            'vertical' => 'field-services',
            'icon' => 'wrench',
            'widgets' => [
                ['id' => 'titan-technician-status', 'position' => [0, 0, 3, 2], 'props' => []],
                ['id' => 'titan-job-list', 'position' => [3, 0, 6, 2], 'props' => []],
                ['id' => 'standard-table', 'position' => [0, 2, 4.5, 3], 'props' => ['title' => 'Job History']],
                ['id' => 'standard-table', 'position' => [4.5, 2, 4.5, 3], 'props' => ['title' => 'Parts Used']],
            ],
        ]);

        // 14. MULTI-VERTICAL OVERVIEW
        $this->registerTemplate('titan-operations-overview', [
            'name' => 'Multi-Vertical Operations Overview',
            'description' => 'High-level view across all service verticals (cleaning, HVAC, plumbing, electrical, landscaping)',
            'category' => 'field-service',
            'vertical' => 'all',
            'icon' => 'bar-chart-2',
            'widgets' => [
                ['id' => 'standard-stat-card', 'position' => [0, 0, 1.8, 1], 'props' => ['label' => 'Total Active Jobs']],
                ['id' => 'standard-stat-card', 'position' => [1.8, 0, 1.8, 1], 'props' => ['label' => 'On-Time %']],
                ['id' => 'standard-stat-card', 'position' => [3.6, 0, 1.8, 1], 'props' => ['label' => 'Avg Completion Rate']],
                ['id' => 'standard-stat-card', 'position' => [5.4, 0, 1.8, 1], 'props' => ['label' => 'Revenue Today']],
                ['id' => 'standard-stat-card', 'position' => [7.2, 0, 1.8, 1], 'props' => ['label' => 'Avg Rating']],
                ['id' => 'standard-chart', 'position' => [0, 1, 4.5, 3], 'props' => ['type' => 'bar', 'title' => 'By Vertical']],
                ['id' => 'standard-chart', 'position' => [4.5, 1, 4.5, 3], 'props' => ['type' => 'line', 'title' => 'Revenue Trend']],
            ],
        ]);

        // 15. CUSTOM AGENT FACTORY DASHBOARD
        $this->registerTemplate('titan-custom-agent-dashboard', [
            'name' => 'Custom AI Agent Factory',
            'description' => 'Monitor custom agents, their performance, decision accuracy, and autonomy level progression',
            'category' => 'ai-governance',
            'vertical' => 'all',
            'icon' => 'bot',
            'widgets' => [
                ['id' => 'standard-table', 'position' => [0, 0, 9, 2], 'props' => ['title' => 'Custom Agents']],
                ['id' => 'standard-stat-card', 'position' => [0, 2, 2.25, 1], 'props' => ['label' => 'Total Agents']],
                ['id' => 'standard-stat-card', 'position' => [2.25, 2, 2.25, 1], 'props' => ['label' => 'Avg Accuracy']],
                ['id' => 'standard-stat-card', 'position' => [4.5, 2, 2.25, 1], 'props' => ['label' => 'Decisions/day']],
                ['id' => 'standard-stat-card', 'position' => [6.75, 2, 2.25, 1], 'props' => ['label' => 'Avg Autonomy Tier']],
                ['id' => 'standard-table', 'position' => [0, 3, 9, 2], 'props' => ['title' => 'Agent Performance Log']],
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
    public function getWidgets(?string $category = null, ?string $vertical = null): array
    {
        $filtered = $this->widgetRegistry;

        if ($category) {
            $filtered = array_filter($filtered, fn($w) => ($w['category'] ?? null) === $category);
        }

        return $filtered;
    }

    /**
     * Get template by ID
     */
    public function getTemplate(string $id): ?array
    {
        return $this->templateRegistry[$id] ?? null;
    }

    /**
     * Get all templates with optional filtering
     */
    public function getTemplates(?string $category = null, ?string $vertical = null): array
    {
        $filtered = $this->templateRegistry;

        if ($category) {
            $filtered = array_filter($filtered, fn($t) => ($t['category'] ?? null) === $category);
        }

        if ($vertical && $vertical !== 'all') {
            $filtered = array_filter($filtered, fn($t) => 
                ($t['vertical'] ?? null) === $vertical || ($t['vertical'] ?? null) === 'all'
            );
        }

        return $filtered;
    }

    /**
     * Get templates by vertical (cleaning, HVAC, plumbing, electrical, landscaping)
     */
    public function getTemplatesByVertical(string $vertical): array
    {
        return array_filter($this->templateRegistry, fn($t) => 
            ($t['vertical'] ?? 'all') === $vertical || ($t['vertical'] ?? 'all') === 'all'
        );
    }

    /**
     * Export widget registry
     */
    public function exportWidgetRegistry(): array
    {
        return [
            'version' => '3.0',
            'system' => 'TitanZero',
            'widgets' => array_values($this->widgetRegistry),
            'stats' => [
                'total_widgets' => count($this->widgetRegistry),
                'field_service_widgets' => count(array_filter($this->widgetRegistry, fn($w) => 
                    ($w['category'] ?? null) === 'field-service'
                )),
                'ai_governance_widgets' => count(array_filter($this->widgetRegistry, fn($w) => 
                    ($w['category'] ?? null) === 'ai-governance'
                )),
            ],
        ];
    }

    /**
     * Export template registry
     */
    public function exportTemplateRegistry(): array
    {
        return [
            'version' => '3.0',
            'system' => 'TitanZero',
            'templates' => array_values($this->templateRegistry),
            'stats' => [
                'total_templates' => count($this->templateRegistry),
                'by_category' => $this->getTemplatesByCategory(),
                'by_vertical' => $this->getTemplatesByVerticalCount(),
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
     * Get templates grouped by vertical
     */
    private function getTemplatesByVerticalCount(): array
    {
        $verticals = [];
        foreach ($this->templateRegistry as $template) {
            $vertical = $template['vertical'] ?? 'all';
            if (!isset($verticals[$vertical])) {
                $verticals[$vertical] = 0;
            }
            $verticals[$vertical]++;
        }
        return $verticals;
    }

    /**
     * Create dashboard from template with customizations
     */
    public function createDashboardFromTemplate(string $templateId, array $customizations = []): array
    {
        $template = $this->getTemplate($templateId);
        if (!$template) {
            throw new InvalidArgumentException("Template '{$templateId}' not found");
        }

        $spec = [
            'version' => '3.0',
            'surface' => 'dashboard',
            'system' => 'TitanZero',
            'template' => $templateId,
            'template_name' => $template['name'] ?? '',
            'category' => $template['category'] ?? '',
            'vertical' => $template['vertical'] ?? 'all',
            'type' => 'titan-dashboard',
            'components' => [],
            'metadata' => [
                'created_from_template' => $templateId,
                'created_at' => now()->toIso8601String(),
                'mobile_first' => $template['mobile_first'] ?? false,
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
     * Generate checksum for spec
     */
    public function generateChecksum(array $spec): string
    {
        return CanonicalJson::checksum($spec);
    }
}
