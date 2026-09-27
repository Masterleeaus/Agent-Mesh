<?php

declare(strict_types=1);

namespace App\Extensions\InteractionEngine\System\Wizard\Governance;

final class GovernanceViolation extends \RuntimeException
{
    /** @param list<string> $violations */
    public function __construct(public readonly array $violations)
    {
        parent::__construct(implode(' ', $violations));
    }
}
