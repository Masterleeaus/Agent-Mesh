<?php

declare(strict_types=1);

namespace App\Extensions\TitanMapsIntelligence\Exports;

use App\Extensions\TitanMapsIntelligence\Contracts\ExportWriter;
use RuntimeException;

final class CsvExportWriter implements ExportWriter
{
    public function write(array $rows): string
    {
        if ($rows === []) {
            return '';
        }

        $stream = fopen('php://temp', 'w+b');
        if ($stream === false) {
            throw new RuntimeException('Unable to open the CSV export buffer.');
        }

        $headers = array_keys($rows[0]);
        fputcsv($stream, $headers);
        foreach ($rows as $row) {
            $values = [];
            foreach ($headers as $header) {
                $value = $row[$header] ?? null;
                $values[] = is_array($value) ? json_encode($value, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE | JSON_THROW_ON_ERROR) : $value;
            }
            fputcsv($stream, $values);
        }

        rewind($stream);
        $contents = stream_get_contents($stream);
        fclose($stream);

        if ($contents === false) {
            throw new RuntimeException('Unable to read the CSV export buffer.');
        }

        return $contents;
    }

    public function extension(): string
    {
        return 'csv';
    }

    public function mimeType(): string
    {
        return 'text/csv; charset=UTF-8';
    }
}
