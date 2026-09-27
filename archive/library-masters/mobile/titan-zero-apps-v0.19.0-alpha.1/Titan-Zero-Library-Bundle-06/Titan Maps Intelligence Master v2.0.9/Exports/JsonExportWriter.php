<?php

declare(strict_types=1);

namespace App\Extensions\TitanMapsIntelligence\Exports;

use App\Extensions\TitanMapsIntelligence\Contracts\ExportWriter;

final class JsonExportWriter implements ExportWriter
{
    public function write(array $rows): string
    {
        return json_encode($rows, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE | JSON_THROW_ON_ERROR);
    }

    public function extension(): string
    {
        return 'json';
    }

    public function mimeType(): string
    {
        return 'application/json';
    }
}
