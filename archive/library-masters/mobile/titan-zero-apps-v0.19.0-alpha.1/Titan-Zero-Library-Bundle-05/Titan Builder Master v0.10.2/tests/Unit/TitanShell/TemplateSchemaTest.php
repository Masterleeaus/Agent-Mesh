<?php

declare(strict_types=1);

use App\Extensions\TitanBuilder\System\TitanShell\TemplateSchema;
use PHPUnit\Framework\TestCase;

final class TemplateSchemaTest extends TestCase
{
    public function test_three_canonical_surfaces_are_available(): void
    {
        $schemas = TemplateSchema::all();
        self::assertCount(3, $schemas);
        self::assertSame(['customer','field','owner'], array_values(array_unique(array_map(static fn(array $s): string => $s['application']['surface'], $schemas))));
    }
}
