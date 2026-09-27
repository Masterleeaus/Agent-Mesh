<?php

namespace App\Extensions\Chatbot\System\Services\Sync;

use Symfony\Component\HttpKernel\Exception\HttpException;

class SyncProtocolException extends HttpException
{
    public function __construct(
        string $message,
        public readonly string $syncCode,
        public readonly int $httpStatus = 422,
        public readonly array $context = [],
    ) {
        parent::__construct($httpStatus, $message);
    }
}
