<?php

declare(strict_types=1);

namespace Modules\TitanZeroAssurance\Services;

use InvalidArgumentException;
use Modules\TitanZeroAssurance\ValueObjects\AuthorityDecision;

final class AuthorityPolicy
{
    private const RISKS = ['low', 'medium', 'high', 'critical'];

    /**
     * @param list<string> $requiredCapabilities
     * @param list<string> $grantedCapabilities
     */
    public function evaluate(string $risk, array $requiredCapabilities, array $grantedCapabilities): AuthorityDecision
    {
        if (!in_array($risk, self::RISKS, true)) {
            throw new InvalidArgumentException('Unsupported authority risk: ' . $risk);
        }

        $missing = array_values(array_diff(array_unique($requiredCapabilities), array_unique($grantedCapabilities)));
        if ($missing !== []) {
            return new AuthorityDecision('blocked', array_map(static fn (string $key): string => 'missing_capability:' . $key, $missing));
        }

        if ($risk !== 'low') {
            return new AuthorityDecision('approval_required', ['risk_requires_approval:' . $risk]);
        }

        return new AuthorityDecision('allowed');
    }
}
