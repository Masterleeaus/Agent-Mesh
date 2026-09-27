<?php

declare(strict_types=1);
namespace App\Extensions\TitanMapsIntelligence\Services;
use App\Extensions\TitanMapsIntelligence\Contracts\SpatialCommandBusGateway;
use App\Extensions\TitanMapsIntelligence\DTO\SpatialExecutionContext;
final class UnavailableSpatialCommandBusGateway implements SpatialCommandBusGateway
{
    public function available(): bool { return false; }
    public function execute(SpatialExecutionContext $context,string $capability,array $payload,string $idempotencyKey): array
    { return ['ok'=>false,'receipt_id'=>null,'data'=>null,'error'=>['code'=>'MAPS_COMMAND_BUS_UNAVAILABLE','message'=>'Titan Command Bus is unavailable for authoritative execution.']]; }
}
