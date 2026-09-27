<?php

declare(strict_types=1);

namespace App\Extensions\TitanInterfaceRuntime\System\Presentation;

final class PresentationComponentPolicy
{
    /** @param array<string,mixed> $component */
    public function accepts(array $component, ResponsiveHints $responsive): bool
    {
        $id = $component['id'] ?? null;
        if (! is_string($id) || preg_match('/^[a-z0-9]+(?:-[a-z0-9]+)*$/', $id) !== 1) return false;
        if (($component['authority'] ?? null) !== 'presentation-only') return false;
        if (($component['accessible'] ?? false) !== true) return false;
        if ($responsive->requiresResponsiveComponent() && ($component['responsive'] ?? false) !== true) return false;
        return true;
    }
}
