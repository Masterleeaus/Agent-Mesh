<?php

declare(strict_types=1);

namespace Tests\Architecture\Extensions\TitanInterfaceRuntime;

use RecursiveDirectoryIterator;
use RecursiveIteratorIterator;
use RegexIterator;
use Tests\TestCase;

final class BoundaryTest extends TestCase
{
    public function test_runtime_does_not_import_other_extension_concrete_types(): void
    {
        $root = dirname(__DIR__, 2);
        $files = new RegexIterator(
            new RecursiveIteratorIterator(new RecursiveDirectoryIterator($root . '/System')),
            '/\.php$/',
        );
        $violations = [];

        foreach ($files as $file) {
            $text = (string) file_get_contents($file->getPathname());
            if (! preg_match_all('/^use App\\\\Extensions\\\\([^\\\\;]+)\\\\([^;]+);/m', $text, $matches, PREG_SET_ORDER)) {
                continue;
            }
            foreach ($matches as $match) {
                if ($match[1] === 'TitanInterfaceRuntime') {
                    continue;
                }
                $violations[] = $file->getFilename() . ': ' . $match[0];
            }
        }

        self::assertSame([], $violations, implode("\n", $violations));
    }
}
