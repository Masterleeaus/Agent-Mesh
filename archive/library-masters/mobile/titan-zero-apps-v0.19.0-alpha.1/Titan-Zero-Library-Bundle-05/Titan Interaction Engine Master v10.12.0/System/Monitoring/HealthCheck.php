<?php

declare(strict_types=1);

namespace App\Extensions\InteractionEngine\System\Monitoring;

use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Schema;
use App\Extensions\InteractionEngine\System\Registry\InteractionRegistry;
use App\Extensions\InteractionEngine\System\Registry\CapabilityRegistry;
use App\Extensions\InteractionEngine\System\Capabilities\CapabilityProviderRegistry;
use App\Extensions\InteractionEngine\System\Wizard\WizardRegistry;

final class HealthCheck
{
    public function __construct(
        private readonly InteractionRegistry $interactions,
        private readonly WizardRegistry $wizards,
        private readonly CapabilityRegistry $capabilities,
        private readonly CapabilityProviderRegistry $providers,
    ) {}

    public function run(): array
    {
        $checks = [
            $this->check('php', static fn(): array => [
                'healthy' => version_compare(PHP_VERSION, '8.2.0', '>='),
                'detail' => PHP_VERSION,
            ]),
            $this->check('sodium', static fn(): array => [
                'healthy' => extension_loaded('sodium'),
                'detail' => extension_loaded('sodium') ? 'loaded' : 'missing',
            ]),
            $this->check('database', static function (): array {
                app('db')->connection()->getPdo();
                return ['healthy' => true, 'detail' => app('db')->connection()->getDatabaseName()];
            }),
            $this->check('cache', static function (): array {
                $key = 'interaction:health:' . bin2hex(random_bytes(4));
                Cache::put($key, 'ok', 10);
                $healthy = Cache::get($key) === 'ok';
                Cache::forget($key);
                return ['healthy' => $healthy, 'detail' => $healthy ? 'read/write' : 'read/write failed'];
            }),
            $this->check('interaction_definitions', fn(): array => [
                'healthy' => count($this->interactions->all()) > 0,
                'detail' => count($this->interactions->all()) . ' loaded',
            ]),
            $this->check('wizard_definitions', fn(): array => [
                'healthy' => count($this->wizards->all()) >= 5,
                'detail' => count($this->wizards->all()) . ' loaded',
            ]),
            $this->check('capability_catalogue', function (): array {
                $declared = $this->capabilities->declaredCapabilities();
                return [
                    'healthy' => count($declared) >= 29,
                    'status' => 'ready',
                    'detail' => sprintf('%d canonical capabilities declared across router and local Interaction handlers', count($declared)),
                ];
            }),
            $this->check('capability_providers', function (): array {
                $summary = [];
                $supportedTotal = 0;
                foreach ($this->providers->all() as $key => $provider) {
                    $declared = count($provider->descriptors());
                    $supported = count(array_filter(array_keys($provider->descriptors()), static fn(string $capability): bool => $provider->supports($capability)));
                    $supportedTotal += $supported;
                    $summary[] = sprintf('%s %d/%d', $key, $supported, $declared);
                }
                return [
                    'healthy' => count($this->providers->providerKeys()) === 6,
                    'status' => $supportedTotal > 0 ? 'ready' : 'degraded',
                    'detail' => implode('; ', $summary) . ($supportedTotal === 0 ? '; optional owning-extension gateways are not currently bound' : ''),
                ];
            }),
            $this->check('onboarding_execution', function (): array {
                $actions = $this->capabilities->declaredCapabilities();
                $required = array_values(array_filter($actions, static fn(string $capability): bool =>
                    str_starts_with($capability, 'crm.business.') ||
                    str_starts_with($capability, 'builder.') ||
                    str_starts_with($capability, 'chatbot.') ||
                    str_starts_with($capability, 'communications.connection.') ||
                    str_starts_with($capability, 'ai.') ||
                    str_starts_with($capability, 'mobile.')
                ));
                $supported = array_values(array_filter($required, fn(string $capability): bool => (bool)($this->capabilities->status($capability)['supported'] ?? false)));
                return [
                    'healthy' => true, // Optional provider absence must not prevent Interaction Engine boot.
                    'status' => count($supported) === count($required) && $required !== [] ? 'ready' : 'degraded',
                    'detail' => sprintf('%d/%d external onboarding capabilities have a currently bound provider contract', count($supported), count($required)),
                ];
            }),
            $this->check('tenancy_contract', static function (): array {
                $keys = array_values(array_filter(array_map('trim', (array) config('interaction-engine.company_context.user_company_keys', ['company_id']))));
                $healthy = in_array('company_id', $keys, true) && !in_array('team_id', $keys, true);
                return [
                    'healthy' => $healthy,
                    'detail' => $healthy ? 'company_id' : 'expected company_id and no team_id fallback',
                ];
            }),
            $this->check('owned_tables', static function (): array {
                $required = [
                    'interaction_runs',
                    'interaction_answers',
                    'interaction_events',
                    'interaction_cognitive_events',
                    'local_intelligence_memories',
                    'interaction_queued_commands',
                    'interaction_episodic_memory',
                    'interaction_semantic_memory',
                    'interaction_audit_logs',
                    'interaction_governance_logs',
                    'interaction_user_actions',
                    'interaction_user_preferences',
                    'interaction_platform_settings',
                    'interaction_company_settings',
                    'interaction_wizard_outbox',
                ];
                $missing = array_values(array_filter($required, static fn(string $table): bool => !Schema::hasTable($table)));
                return [
                    'healthy' => $missing === [],
                    'detail' => $missing === [] ? 'all extension-owned tables present' : 'missing: ' . implode(', ', $missing),
                ];
            }),
            $this->check('outbox_secret', static function (): array {
                $secret = (string) config('interaction-engine.wizard.outbox_secret', '');
                $weak = trim($secret) === '' || str_contains(strtolower($secret), 'change-me');
                return ['healthy' => !$weak, 'detail' => $weak ? 'not configured' : 'configured'];
            }),
            $this->check('approval_secret', static function (): array {
                $secret = (string) config('interaction-engine.authority.approval_secret', '');
                $weak = strlen(trim($secret)) < 16 || str_contains(strtolower($secret), 'change-me');
                return ['healthy' => !$weak, 'detail' => $weak ? 'not configured' : 'configured'];
            }),
        ];

        $healthy = !in_array(false, array_column($checks, 'healthy'), true);
        $degraded = in_array('degraded', array_column($checks, 'status'), true);
        return [
            'healthy' => $healthy,
            'status' => !$healthy ? 'failed' : ($degraded ? 'degraded' : 'ready'),
            'checked_at' => gmdate(DATE_ATOM),
            'checks' => $checks,
        ];
    }

    private function check(string $name, callable $check): array
    {
        try {
            $result = $check();
            return [
                'name' => $name,
                'healthy' => (bool) ($result['healthy'] ?? false),
                'status' => (string) ($result['status'] ?? (($result['healthy'] ?? false) ? 'ready' : 'failed')),
                'detail' => (string) ($result['detail'] ?? ''),
            ];
        } catch (\Throwable $error) {
            return ['name' => $name, 'healthy' => false, 'status' => 'failed', 'detail' => $error->getMessage()];
        }
    }
}
