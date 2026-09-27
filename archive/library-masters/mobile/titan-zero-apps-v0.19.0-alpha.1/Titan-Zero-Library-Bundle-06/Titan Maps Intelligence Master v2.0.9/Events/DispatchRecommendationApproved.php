<?php

declare(strict_types=1);
namespace App\Extensions\TitanMapsIntelligence\Events;
final readonly class DispatchRecommendationApproved
{
    public function __construct(public string $companyId, public string $recommendationId, public string $jobPublicId, public string $workerPublicId, public string $assignmentStatus) {}
}
