<?php

declare(strict_types=1);

namespace App\Extensions\InteractionEngine\System\Policy;

use App\Extensions\InteractionEngine\System\Authority\AuthorityDecision;
use App\Extensions\InteractionEngine\System\Authority\AuthorityLevel;
use App\Extensions\InteractionEngine\System\Authority\ApprovalSigner;
use App\Extensions\InteractionEngine\System\Authority\CapabilityPolicy;
use App\Extensions\InteractionEngine\System\Contracts\PolicyEngineInterface;

class PolicyEngine implements PolicyEngineInterface
{
    public function __construct(private readonly ?ApprovalSigner $approvalSigner = null) {}
    private array $policies = [];
    private array $capabilityPolicies = [];
    private array $reasons = [];

    public function registerCapabilityPolicy(CapabilityPolicy $policy): void
    {
        $this->capabilityPolicies[$policy->capability] = $policy;
    }

    public function registerPolicy(string $capability, callable $policy): void
    {
        $this->policies[$capability][] = $policy;
    }

    public function decide(string $capability, array $payload): AuthorityDecision
    {
        $this->reasons = [];
        $definition = $this->capabilityPolicies[$capability] ?? null;
        if (!$definition instanceof CapabilityPolicy) {
            return $this->deny($capability, AuthorityLevel::PrepareOnly, 'No authority policy is registered for this capability.');
        }

        $context = (array) ($payload['_context'] ?? []);
        $actorType = (string) ($context['actor_type'] ?? 'unknown');
        $roles = array_values(array_map('strval', (array) ($context['roles'] ?? [])));

        if ($definition->authority === AuthorityLevel::ObserveOnly || $definition->authority === AuthorityLevel::RecommendOnly || $definition->authority === AuthorityLevel::PrepareOnly) {
            return $this->deny($capability, $definition->authority, 'This capability cannot be executed at its configured authority level.');
        }

        if ($definition->authority === AuthorityLevel::UserOnly) {
            if ($actorType !== 'human' || empty($context['user_id'])) {
                return $this->deny($capability, $definition->authority, 'A verified human user must perform this action.');
            }
            if (!$this->hasAnyRole($roles, $definition->requiredRoles)) {
                return $this->deny($capability, $definition->authority, 'The user does not hold a required role.');
            }
        }

        if ($definition->authority === AuthorityLevel::ApprovalRequired) {
            $approval = (array) ($payload['_approval'] ?? []);
            $now = time();
            $valid = $this->approvalSigner instanceof ApprovalSigner
                && $this->approvalSigner->verify($approval)
                && ($approval['capability'] ?? null) === $capability
                && !empty($approval['approved_by'])
                && (int) ($approval['approved_at'] ?? 0) > 0
                && (int) ($approval['expires_at'] ?? 0) >= $now
                && (int) ($approval['expires_at'] ?? 0) - (int) ($approval['approved_at'] ?? 0) <= $definition->approvalTtlSeconds
                && (string) ($approval['company_id'] ?? '') === (string) ($context['company_id'] ?? '')
                && (!isset($approval['company_id']) || (string) $approval['company_id'] === (string) ($context['company_id'] ?? ''))
                && (!isset($context['company_id']) || (string) $context['company_id'] === (string) ($context['company_id'] ?? ''));
            $approverRoles = array_values(array_map('strval', (array) ($approval['approver_roles'] ?? [])));
            if (!$valid || !$this->hasAnyRole($approverRoles, $definition->requiredRoles)) {
                return $this->deny($capability, $definition->authority, 'A valid, scoped and unexpired human approval is required.');
            }
        }

        if ($definition->freshAuthenticationSeconds > 0) {
            $authenticatedAt = (int) ($context['authenticated_at'] ?? 0);
            if ($authenticatedAt <= 0 || (time() - $authenticatedAt) > $definition->freshAuthenticationSeconds) {
                return $this->deny($capability, $definition->authority, 'Fresh authentication is required.');
            }
        }

        if ($definition->authority === AuthorityLevel::DelegatedAutonomous) {
            $scopes = array_values(array_map('strval', (array) ($context['delegated_scopes'] ?? [])));
            foreach ($definition->delegatedScopes as $scope) {
                if (!in_array((string) $scope, $scopes, true)) {
                    return $this->deny($capability, $definition->authority, "Missing delegated scope: {$scope}.");
                }
            }
        }

        foreach ($definition->numericLimits as $field => $maximum) {
            if (isset($payload[$field]) && (float) $payload[$field] > (float) $maximum) {
                return $this->deny($capability, $definition->authority, "{$field} exceeds delegated limit.");
            }
        }

        foreach ($this->policies[$capability] ?? [] as $policy) {
            $result = $policy($payload);
            if (is_string($result)) {
                return $this->deny($capability, $definition->authority, $result);
            }
            if ($result === false) {
                return $this->deny($capability, $definition->authority, 'Policy failed.');
            }
            if (is_array($result) && !($result['allowed'] ?? false)) {
                return $this->deny($capability, $definition->authority, (string) ($result['reason'] ?? 'Policy failed.'));
            }
        }

        return new AuthorityDecision(true, $capability, $definition->authority);
    }

    public function evaluate(string $capability, array $payload): bool
    {
        return $this->decide($capability, $payload)->allowed;
    }

    public function getReasons(): array
    {
        return $this->reasons;
    }

    private function deny(string $capability, AuthorityLevel $authority, string $reason): AuthorityDecision
    {
        $this->reasons = [$reason];
        return AuthorityDecision::deny($capability, $authority, $reason);
    }

    private function hasAnyRole(array $actual, array $required): bool
    {
        return $required === [] || array_intersect($actual, $required) !== [];
    }
}
