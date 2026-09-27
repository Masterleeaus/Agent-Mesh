<?php

declare(strict_types=1);
namespace App\Extensions\TitanMapsIntelligence\Events;
final readonly class DispatchRecommendationRejected
{
    public function __construct(public string $companyId, public string $recommendationId, public ?string $workerPublicId, public ?string $reason) {}
}
