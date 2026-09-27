<?php

declare(strict_types=1);

namespace App\Extensions\InteractionEngine\System\Engines\Executive\Implementations;

use App\Extensions\InteractionEngine\System\Engines\Executive\Contracts\EscalationEngineInterface;
class EscalationEngine implements EscalationEngineInterface
{
    private array $escalations = [];
    private array $policy = [
        'levels' => ['low', 'medium', 'high', 'critical'],
        'default_level' => 'medium',
        'auto_escalate_after_minutes' => 60,
    ];

    public function escalate(string $issue, array $context): void
    {
        $level = $context['severity'] ?? $this->policy['default_level'];
        $this->escalations[] = [
            'id' => uniqid('esc_'),
            'issue' => $issue,
            'level' => $level,
            'context' => $context,
            'status' => 'active',
            'created_at' => now(),
        ];
    }

    public function getEscalations(): array
    {
        return $this->escalations;
    }

    public function resolve(string $id, array $resolution): void
    {
        foreach ($this->escalations as &$esc) {
            if ($esc['id'] === $id) {
                $esc['status'] = 'resolved';
                $esc['resolution'] = $resolution;
                $esc['resolved_at'] = now();
            }
        }
        unset($esc);
    }

    public function getEscalationPolicy(): array
    {
        return $this->policy;
    }
}
