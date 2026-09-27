<?php

declare(strict_types=1);
namespace App\Extensions\TitanMapsIntelligence\Services;
use App\Extensions\TitanMapsIntelligence\Contracts\DispatchAssignmentGateway;
use App\Extensions\TitanMapsIntelligence\DTO\DispatchJobContext;
final class UnavailableDispatchAssignmentGateway implements DispatchAssignmentGateway
{
    public function assign(string $companyId, DispatchJobContext $job, array $candidate, array $options=[]): array
    { return ['status'=>'unavailable','reference'=>null,'message'=>'No authoritative dispatch assignment adapter is available.']; }
}
