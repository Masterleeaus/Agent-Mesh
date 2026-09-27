<?php
declare(strict_types=1);
namespace App\Extensions\TitanVisualRuntime\System\Contracts;
interface VisualMetadataContract {
    public function version(): string;
    public function assertProducerCompatible(string $producerVersion): void;
    public function assertSchemaFingerprint(string $sha256): void;
}
