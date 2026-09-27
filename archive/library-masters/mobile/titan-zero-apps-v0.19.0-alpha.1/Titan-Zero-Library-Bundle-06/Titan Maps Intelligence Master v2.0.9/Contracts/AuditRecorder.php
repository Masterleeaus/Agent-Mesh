<?php

declare(strict_types=1);

namespace App\Extensions\TitanMapsIntelligence\Contracts;

interface AuditRecorder
{
    public function record(array $record): void;
}
