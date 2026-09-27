<?php

declare(strict_types=1);

namespace App\Extensions\TitanGo\System\Contracts;

interface TitanFieldMobileGatewayInterface
{
    public function contextRoute(): string;
    public function registerDeviceRoute(): string;
    public function replayRoute(): string;
    public function syncRoute(): string;
    public function evidenceRoute(): string;
    public function replayOperations(): array;
    public function maxBatchSize(): int;
}
