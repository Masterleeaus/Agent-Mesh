<?php

declare(strict_types=1);

namespace App\Extensions\TitanBuilder\System\Audit;

use Illuminate\Support\Facades\Log;

final class BuilderAuditLogger
{
    public function record(int $companyId, ?string $actorId, string $action, array $context = []): void
    {
        Log::info('titan_builder.audit', [
            'company_id' => $companyId,
            'actor' => $actorId,
            'source_surface' => $this->safeText($context['source_surface'] ?? null),
            'action' => $action,
            'project' => isset($context['project']) ? (int) $context['project'] : null,
            'application_surface' => $this->safeText($context['application_surface'] ?? null),
            'version' => $context['version'] ?? null,
            'correlation_id' => $this->safeText($context['correlation_id'] ?? null),
            'result' => $this->safeText($context['result'] ?? 'ok'),
            'timestamp' => now()->toISOString(),
        ]);
    }

    private function safeText(mixed $value): ?string
    {
        if (! is_string($value)) { return null; }
        $value = trim($value);
        return $value === '' ? null : mb_substr($value, 0, 160);
    }
}
