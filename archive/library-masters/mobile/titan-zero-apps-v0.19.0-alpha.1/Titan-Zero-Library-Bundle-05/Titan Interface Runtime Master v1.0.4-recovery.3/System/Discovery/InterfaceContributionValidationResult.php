<?php

declare(strict_types=1);

namespace App\Extensions\TitanInterfaceRuntime\System\Discovery;

final readonly class InterfaceContributionValidationResult
{
    /** @param list<string> $errors */
    public function __construct(public array $errors)
    {
    }

    public function valid(): bool
    {
        return $this->errors === [];
    }
}
