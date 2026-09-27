<?php

declare(strict_types=1);

namespace App\Extensions\InteractionEngine\System\Error;

use Illuminate\Support\Facades\Log;

final class ErrorHandler
{
    public function report(\Throwable $error, array $context = []): array
    {
        $id = self::correlationId();
        $payload = [
            'correlation_id' => $id,
            'type' => $error::class,
            'message' => $error->getMessage(),
            'code' => $error->getCode(),
            'retryable' => $this->isRetryable($error),
            'context' => $this->sanitize($context),
            'occurred_at' => gmdate(DATE_ATOM),
        ];
        Log::error('Interaction Engine failure', $payload);
        return $payload;
    }

    public function userMessage(\Throwable $error): string
    {
        return $this->isRetryable($error)
            ? 'The action could not be completed yet. It is safe to retry.'
            : 'The action could not be completed. Review the supplied details or contact support.';
    }

    public function isRetryable(\Throwable $error): bool
    {
        $message = strtolower($error->getMessage());
        foreach (['timeout', 'temporarily unavailable', 'connection', 'deadlock', 'rate limit', 'try again'] as $signal) {
            if (str_contains($message, $signal)) {
                return true;
            }
        }
        return false;
    }

    private function sanitize(array $context): array
    {
        foreach (['password', 'token', 'api_key', 'authorization', 'secret'] as $field) {
            if (array_key_exists($field, $context)) {
                $context[$field] = '[redacted]';
            }
        }
        return $context;
    }

    private static function correlationId(): string
    {
        return bin2hex(random_bytes(12));
    }
}
