<?php

declare(strict_types=1);

namespace App\Extensions\TitanBuilder\System\Services\Builder;

use App\Extensions\TitanBuilder\System\GenerativeUI\BuilderRegistry;

/**
 * Read-only compatibility catalogue for the Mobilekit-derived Premium layer.
 *
 * Rendering remains owned by Titan's validated Generative UI runtime. This
 * adapter intentionally contains no raw HTML/template substitution path.
 */
final class MobilekitPremiumCatalogue
{
    public function __construct(private readonly BuilderRegistry $registry)
    {
    }

    /** @return list<array<string,mixed>> */
    public function components(): array
    {
        return array_values(array_filter(
            $this->registry->all('components'),
            static fn (array $component): bool => ($component['premium'] ?? false) === true
                && ($component['source'] ?? null) === 'Mobilekit-v2.9.1-MIT'
        ));
    }

    /** @return list<array<string,mixed>> */
    public function pages(): array
    {
        return array_values(array_filter(
            $this->registry->all('pages'),
            static fn (array $page): bool => ($page['premium'] ?? false) === true
                && ($page['source'] ?? null) === 'Mobilekit-v2.9.1-MIT'
        ));
    }

    public function component(string $id): ?array
    {
        $component = $this->registry->find('components', $id);

        return ($component['premium'] ?? false) === true
            && ($component['source'] ?? null) === 'Mobilekit-v2.9.1-MIT'
                ? $component
                : null;
    }
}
