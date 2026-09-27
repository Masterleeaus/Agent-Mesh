<?php

declare(strict_types=1);

namespace App\Extensions\InteractionEngine\System\Engines\Executive\Implementations;

use App\Extensions\InteractionEngine\System\Engines\Executive\Contracts\PolicyEngineInterface;
class PolicyEngine implements PolicyEngineInterface
{
    private array $policies = [];
    private array $violations = [];

    public function evaluate(string $action, array $context): bool
    {
        $this->violations = [];
        foreach ($this->policies as $name => $policy) {
            if (!$policy($action, $context)) {
                $this->violations[] = $name;
                return false;
            }
        }
        return true;
    }

    public function getViolations(string $action, array $context): array
    {
        $this->evaluate($action, $context);
        return $this->violations;
    }

    public function addPolicy(string $name, callable $policy): void
    {
        $this->policies[$name] = $policy;
    }

    public function listPolicies(): array
    {
        return array_keys($this->policies);
    }
}
