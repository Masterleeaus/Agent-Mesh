<?php

declare(strict_types=1);

namespace App\Extensions\TitanMapsIntelligence\Exports;

use App\Extensions\TitanMapsIntelligence\Contracts\ExportWriter;
use PharData;
use RuntimeException;

final class XlsxExportWriter implements ExportWriter
{
    public function write(array $rows): string
    {
        $headers = $rows === [] ? [] : array_keys($rows[0]);
        $temporary = tempnam(sys_get_temp_dir(), 'titan-maps-xlsx-');
        if ($temporary === false) {
            throw new RuntimeException('Unable to allocate an XLSX export buffer.');
        }
        @unlink($temporary);
        $archivePath = $temporary.'.zip';

        try {
            $archive = new PharData($archivePath);
            $archive->addFromString('[Content_Types].xml', $this->contentTypesXml());
            $archive->addFromString('_rels/.rels', $this->rootRelationshipsXml());
            $archive->addFromString('xl/workbook.xml', $this->workbookXml());
            $archive->addFromString('xl/_rels/workbook.xml.rels', $this->workbookRelationshipsXml());
            $archive->addFromString('xl/worksheets/sheet1.xml', $this->worksheetXml($headers, $rows));
            unset($archive);

            $contents = file_get_contents($archivePath);
            if ($contents === false) {
                throw new RuntimeException('Unable to read the XLSX export buffer.');
            }

            return $contents;
        } finally {
            @unlink($archivePath);
        }
    }

    public function extension(): string
    {
        return 'xlsx';
    }

    public function mimeType(): string
    {
        return 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
    }

    private function contentTypesXml(): string
    {
        return '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
            .'<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">'
            .'<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>'
            .'<Default Extension="xml" ContentType="application/xml"/>'
            .'<Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>'
            .'<Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>'
            .'</Types>';
    }

    private function rootRelationshipsXml(): string
    {
        return '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
            .'<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">'
            .'<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/>'
            .'</Relationships>';
    }

    private function workbookXml(): string
    {
        return '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
            .'<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">'
            .'<sheets><sheet name="Candidates" sheetId="1" r:id="rId1"/></sheets>'
            .'</workbook>';
    }

    private function workbookRelationshipsXml(): string
    {
        return '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
            .'<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">'
            .'<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/>'
            .'</Relationships>';
    }

    /** @param list<string> $headers @param list<array<string, mixed>> $rows */
    private function worksheetXml(array $headers, array $rows): string
    {
        $allRows = $headers === [] ? [] : [array_combine($headers, $headers), ...$rows];
        $xml = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
            .'<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><sheetData>';

        foreach ($allRows as $rowNumber => $row) {
            $excelRow = $rowNumber + 1;
            $xml .= '<row r="'.$excelRow.'">';
            foreach ($headers as $columnIndex => $header) {
                $cell = $this->columnName($columnIndex + 1).$excelRow;
                $value = $row[$header] ?? null;
                if (is_array($value)) {
                    $value = json_encode($value, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE | JSON_THROW_ON_ERROR);
                } elseif (is_bool($value)) {
                    $value = $value ? 'true' : 'false';
                } elseif ($value === null) {
                    $value = '';
                }
                $xml .= '<c r="'.$cell.'" t="inlineStr"><is><t xml:space="preserve">'.$this->escape((string) $value).'</t></is></c>';
            }
            $xml .= '</row>';
        }

        return $xml.'</sheetData></worksheet>';
    }

    private function columnName(int $number): string
    {
        $name = '';
        while ($number > 0) {
            $number--;
            $name = chr(65 + ($number % 26)).$name;
            $number = intdiv($number, 26);
        }

        return $name;
    }

    private function escape(string $value): string
    {
        return htmlspecialchars($value, ENT_XML1 | ENT_QUOTES, 'UTF-8');
    }
}
