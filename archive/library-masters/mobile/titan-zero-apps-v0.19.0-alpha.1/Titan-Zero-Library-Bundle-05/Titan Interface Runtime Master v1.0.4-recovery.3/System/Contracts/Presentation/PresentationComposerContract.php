<?php

declare(strict_types=1);

namespace App\Extensions\TitanInterfaceRuntime\System\Contracts\Presentation;

use App\Extensions\TitanInterfaceRuntime\System\Context\InterfaceContext;
use App\Extensions\TitanInterfaceRuntime\System\Presentation\PresentationNode;

interface PresentationComposerContract
{
    /**
     * Compose presentation metadata only. This contract must never become a domain write path.
     *
     * @param array<string, mixed> $request
     */
    public function compose(InterfaceContext $context, array $request): PresentationNode;
}
