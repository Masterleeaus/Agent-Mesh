<?php
declare(strict_types=1);
namespace App\Extensions\TitanMcp\System\Workforce;

final class ProviderSelector
{
    /**
     * @param list<CapabilityAvailability> $candidates
     */
    public function select(array $candidates, ?string $pinnedProviderKey = null): ?CapabilityAvailability
    {
        $eligible = array_values(array_filter(
            $candidates,
            static fn($c) => $c instanceof CapabilityAvailability && in_array($c->state, ['available','degraded'], true)
        ));
        if ($pinnedProviderKey !== null) {
            foreach ($eligible as $candidate) {
                if ($candidate->providerKey === $pinnedProviderKey) { return $candidate; }
            }
            return null;
        }
        return count($eligible) === 1 ? $eligible[0] : null;
    }
}
