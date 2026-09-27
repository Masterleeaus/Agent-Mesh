<?php

declare(strict_types=1);

namespace App\Extensions\TitanMapsIntelligence\Contracts;

interface CandidateRepository
{
    public function findForCompany(string $companyId, string $candidateId): ?array;
    public function recordPromotion(array $promotion): void;
}
