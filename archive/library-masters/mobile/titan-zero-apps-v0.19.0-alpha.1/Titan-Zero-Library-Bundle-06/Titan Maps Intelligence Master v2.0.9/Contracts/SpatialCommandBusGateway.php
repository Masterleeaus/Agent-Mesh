<?php

declare(strict_types=1);

namespace App\Extensions\TitanMapsIntelligence\Contracts;

use App\Extensions\TitanMapsIntelligence\DTO\SpatialExecutionContext;

interface SpatialCommandBusGateway
{
    public function available(): bool;

    /** @return array{ok:bool,receipt_id:?string,data:mixed,error:?array} */
    public function execute(SpatialExecutionContext $context, string $capability, array $payload, string $idempotencyKey): array;
}
