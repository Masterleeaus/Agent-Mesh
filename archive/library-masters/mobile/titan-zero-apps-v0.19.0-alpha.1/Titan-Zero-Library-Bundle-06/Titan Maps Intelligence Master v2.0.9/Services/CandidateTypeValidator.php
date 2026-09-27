<?php

declare(strict_types=1);

namespace App\Extensions\TitanMapsIntelligence\Services;

use App\Extensions\TitanMapsIntelligence\Enums\CandidateType;
use App\Extensions\TitanMapsIntelligence\Exceptions\MapsIntelligenceException;

final class CandidateTypeValidator
{
    public function validate(string $candidateType): string
    {
        $value = trim($candidateType);
        if (CandidateType::tryFrom($value) === null) {
            throw MapsIntelligenceException::fromCode('MAPS_INVALID_CANDIDATE_TYPE', 'The candidate type is not supported.');
        }

        return $value;
    }
}
