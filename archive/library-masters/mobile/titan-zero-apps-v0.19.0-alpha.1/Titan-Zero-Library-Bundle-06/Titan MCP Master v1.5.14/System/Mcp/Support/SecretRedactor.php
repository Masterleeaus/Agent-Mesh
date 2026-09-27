<?php

declare(strict_types=1);

namespace App\Extensions\TitanMcp\System\Mcp\Support;

final class SecretRedactor
{
    private const SENSITIVE_KEY = '/(?:password|passwd|secret|(?:access|refresh|id)?[_-]?token|api[_-]?key|key[_-]?hash|private[_-]?key|client[_-]?secret|authorization|cookie|credential|remember[_-]?token|google2fa|webhook[_-]?secret)/i';

    public function redact(mixed $value, ?string $key = null): mixed
    {
        if ($key !== null && preg_match(self::SENSITIVE_KEY, $key)) {
            return '[REDACTED]';
        }
        if (is_array($value)) {
            $out = [];
            foreach ($value as $childKey => $childValue) {
                $out[$childKey] = $this->redact($childValue, (string) $childKey);
            }
            return $out;
        }
        if (is_object($value)) {
            return $this->redact((array) $value, $key);
        }
        if (is_string($value)) {
            return $this->redactString($value);
        }
        return $value;
    }

    private function redactString(string $value): string
    {
        $value = preg_replace('/Bearer\s+[A-Za-z0-9._~+\/-]+=*/i', 'Bearer [REDACTED]', $value) ?? $value;
        $value = preg_replace('/\bsk-[A-Za-z0-9_-]{12,}\b/', '[REDACTED]', $value) ?? $value;
        $value = preg_replace('/\b(?:sk|rk)_(?:live|test)_[A-Za-z0-9]{12,}\b/i', '[REDACTED_PAYMENT_KEY]', $value) ?? $value;
        $value = preg_replace('/\b(?:github_pat_[A-Za-z0-9_]{20,}|gh[pousr]_[A-Za-z0-9_]{20,})\b/i', '[REDACTED_GITHUB_TOKEN]', $value) ?? $value;
        $value = preg_replace('/\bxox[baprs]-[A-Za-z0-9-]{20,}\b/i', '[REDACTED_SLACK_TOKEN]', $value) ?? $value;
        $value = preg_replace('/\bAIza[A-Za-z0-9_-]{20,}\b/', '[REDACTED_GOOGLE_API_KEY]', $value) ?? $value;
        $value = preg_replace('/\b(?:AKIA|ASIA)[A-Z0-9]{16}\b/', '[REDACTED_AWS_ACCESS_KEY]', $value) ?? $value;
        $value = preg_replace('/\beyJ[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]{8,}\b/', '[REDACTED_JWT]', $value) ?? $value;
        $value = preg_replace('#([a-z][a-z0-9+.-]*://[^:/\s]+:)[^@\s/]+@#i', '$1[REDACTED]@', $value) ?? $value;
        $value = preg_replace_callback(
            '/\b(password|passwd|secret|(?:[a-z0-9]+[_-])*token|api[_-]?key|key[_-]?hash|private[_-]?key|client[_-]?secret|authorization|cookie|credential|remember[_-]?token|google2fa|webhook[_-]?secret)\b\s*([=:])\s*("[^"]*"|\'[^\']*\'|[^\s,;]+)/i',
            static fn (array $m): string => $m[1].$m[2].'[REDACTED]',
            $value
        ) ?? $value;
        return $value;
    }
}
