<?php

declare(strict_types=1);
namespace App\Extensions\TitanMapsIntelligence\Services;
use App\Extensions\TitanMapsIntelligence\Contracts\SpatialKnowledgeGateway;
use App\Extensions\TitanMapsIntelligence\DTO\SpatialExecutionContext;
final class UnavailableSpatialKnowledgeGateway implements SpatialKnowledgeGateway
{
    public function resolveJurisdiction(SpatialExecutionContext $context,array $location,array $scope=[]): array
    { return ['available'=>false,'references'=>[],'reason_codes'=>['KNOWLEDGE_AUTHORITY_UNAVAILABLE']]; }
}
