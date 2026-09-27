<?php

declare(strict_types=1);

namespace App\Extensions\TitanMapsIntelligence\Contracts;

use DateTimeInterface;

interface PrivateExportStore
{
    /**
     * Store an export privately and return a short-lived, authorised reference.
     *
     * @return array{reference:string,signed_url:string,expires_at:string}
     */
    public function put(
        string $companyId,
        string $filename,
        string $mimeType,
        string $contents,
        DateTimeInterface $expiresAt,
    ): array;
}
