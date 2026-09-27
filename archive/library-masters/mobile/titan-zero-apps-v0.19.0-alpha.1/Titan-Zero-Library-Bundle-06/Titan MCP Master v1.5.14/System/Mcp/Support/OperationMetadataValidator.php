<?php

declare(strict_types=1);

namespace App\Extensions\TitanMcp\System\Mcp\Support;

use InvalidArgumentException;

final class OperationMetadataValidator
{
    public function __construct(
        private readonly int $maxReasonChars = 2000,
        private readonly int $maxRunIdChars = 256,
        private readonly int $maxRequestIdChars = 256,
    ) {}

    /** @return array{reason:string,run_id:?string,request_id:?string} */
    public function normalize(string $reason, ?string $runId, ?string $requestId): array
    {
        $reason = trim($reason);
        if ($reason === '' || strlen($reason) > max(1, $this->maxReasonChars) || $this->hasControls($reason)) {
            throw new InvalidArgumentException('A bounded mutation reason without control characters is required.');
        }
        $runId = $this->identifier($runId, max(1, $this->maxRunIdChars), 'run ID');
        $requestId = $this->identifier($requestId, max(1, $this->maxRequestIdChars), 'request ID');
        return ['reason' => $reason, 'run_id' => $runId, 'request_id' => $requestId];
    }

    private function identifier(?string $value, int $max, string $label): ?string
    {
        if ($value === null) return null;
        $value = trim($value);
        if ($value === '' || strlen($value) > $max || preg_match('/^[A-Za-z0-9._:-]+$/D', $value) !== 1) {
            throw new InvalidArgumentException("Invalid Titan MCP {$label}.");
        }
        return $value;
    }

    private function hasControls(string $value): bool
    {
        return preg_match('/[\x00-\x1F\x7F]/', $value) === 1;
    }
}
