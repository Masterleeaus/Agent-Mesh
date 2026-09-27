<?php

declare(strict_types=1);

namespace App\Extensions\TitanMapsIntelligence\Contracts;

interface ExportWriter
{
    /** @param list<array<string, mixed>> $rows */
    public function write(array $rows): string;

    public function extension(): string;

    public function mimeType(): string;
}
