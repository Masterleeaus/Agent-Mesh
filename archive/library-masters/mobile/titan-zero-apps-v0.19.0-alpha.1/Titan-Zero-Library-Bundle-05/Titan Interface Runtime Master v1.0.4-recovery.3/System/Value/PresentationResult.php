<?php

declare(strict_types=1);

namespace App\Extensions\TitanInterfaceRuntime\System\Value;

final readonly class PresentationResult
{
    /** @param array<string,mixed> $tree @param list<string> $repairs */
    public function __construct(public array $tree, public array $repairs = [], public bool $fallback = false) {}
}
