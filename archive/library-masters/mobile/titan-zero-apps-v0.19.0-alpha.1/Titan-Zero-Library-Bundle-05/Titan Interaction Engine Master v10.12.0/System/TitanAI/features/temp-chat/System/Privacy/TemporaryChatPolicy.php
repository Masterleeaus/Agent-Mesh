<?php

declare(strict_types=1);

namespace App\Extensions\TempChat\System\Privacy;

final class TemporaryChatPolicy
{
    public function __construct(private readonly array $config = [])
    {
    }

    public function enabled(): bool
    {
        return (bool) ($this->config['enabled'] ?? true);
    }

    public function retentionMinutes(): int
    {
        return max(0, (int) ($this->config['retention_minutes'] ?? 0));
    }

    public function retainsUploadedContent(): bool
    {
        return (bool) ($this->config['retain_uploaded_content'] ?? true);
    }

    public function retainsToolTraces(): bool
    {
        return (bool) ($this->config['retain_tool_traces'] ?? false);
    }

    public function description(): string
    {
        $parts = ["This conversation won't appear in your chat history."];

        if ($this->retentionMinutes() > 0) {
            $parts[] = sprintf('Temporary conversation data may be retained for up to %d minutes for processing and abuse prevention.', $this->retentionMinutes());
        }

        if ($this->retainsUploadedContent()) {
            $parts[] = 'Any uploaded content may remain in the content manager according to its separate retention policy.';
        }

        if ($this->retainsToolTraces()) {
            $parts[] = 'Tool execution traces may remain in operational logs.';
        }

        return implode(' ', $parts);
    }
}
