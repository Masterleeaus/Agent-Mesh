<?php

declare(strict_types=1);

namespace App\Extensions\TitanMapsIntelligence\Services;

use App\Extensions\TitanMapsIntelligence\Contracts\AuditRecorder;
use Illuminate\Support\Facades\Log;

final class LogAuditRecorder implements AuditRecorder
{
    public function record(array $record): void
    {
        Log::info('Titan Maps Intelligence audit', ['maps_audit' => $this->redact($record)]);
    }

    private function redact(array $value): array
    {
        foreach ($value as $key => $item) {
            $normalised = strtolower((string) $key);
            if (str_contains($normalised, 'secret') || str_contains($normalised, 'token') || str_contains($normalised, 'credential') || str_contains($normalised, 'api_key')) {
                $value[$key] = '[REDACTED]';
                continue;
            }
            if (is_array($item)) {
                $value[$key] = $this->redact($item);
            }
        }

        return $value;
    }
}
