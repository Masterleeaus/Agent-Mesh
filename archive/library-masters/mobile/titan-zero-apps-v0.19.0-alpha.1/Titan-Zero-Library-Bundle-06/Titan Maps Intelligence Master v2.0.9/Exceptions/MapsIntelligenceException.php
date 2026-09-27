<?php

declare(strict_types=1);

namespace App\Extensions\TitanMapsIntelligence\Exceptions;

use RuntimeException;
use Throwable;

class MapsIntelligenceException extends RuntimeException
{
    public function __construct(
        private readonly string $stableCode,
        string $message,
        private readonly array $safeContext = [],
        ?Throwable $previous = null,
    ) {
        parent::__construct($message, 0, $previous);
    }

    public static function fromCode(string $code, string $message, array $safeContext = [], ?Throwable $previous = null): static
    {
        return new static($code, $message, $safeContext, $previous);
    }

    public function errorCode(): string
    {
        return $this->stableCode;
    }

    public function context(): array
    {
        return $this->safeContext;
    }

    public function toSafeArray(): array
    {
        return [
            'code' => $this->stableCode,
            'message' => $this->getMessage(),
            'context' => $this->safeContext,
        ];
    }
}
