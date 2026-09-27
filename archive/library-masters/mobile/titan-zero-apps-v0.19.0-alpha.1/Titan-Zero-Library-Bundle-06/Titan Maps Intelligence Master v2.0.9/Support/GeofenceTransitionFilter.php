<?php

declare(strict_types=1);

namespace App\Extensions\TitanMapsIntelligence\Support;

final class GeofenceTransitionFilter
{
    /** @return array{candidate_state:?string,candidate_samples:int,transition:?string} */
    public function next(bool $currentlyInside, ?string $candidateState, int $candidateSamples, bool $observedInside, int $requiredSamples): array
    {
        $current = $currentlyInside ? 'inside' : 'outside';
        $target = $observedInside ? 'inside' : 'outside';
        if ($target === $current) return ['candidate_state'=>null,'candidate_samples'=>0,'transition'=>null];
        $samples = $candidateState === $target ? $candidateSamples + 1 : 1;
        if ($samples >= max(1, $requiredSamples)) return ['candidate_state'=>null,'candidate_samples'=>0,'transition'=>$target];
        return ['candidate_state'=>$target,'candidate_samples'=>$samples,'transition'=>null];
    }
}
