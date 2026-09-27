<?php

declare(strict_types=1);

namespace Tests\Architecture\Extensions\TitanInterfaceRuntime;

use RecursiveDirectoryIterator;
use RecursiveIteratorIterator;
use RegexIterator;
use Tests\TestCase;

final class NoBusinessPersistenceTest extends TestCase
{
    public function test_runtime_has_no_direct_business_persistence_write_path(): void
    {
        $root = dirname(__DIR__, 2);
        $files = new RegexIterator(
            new RecursiveIteratorIterator(new RecursiveDirectoryIterator($root . '/System')),
            '/\.php$/',
        );
        $patterns = [
            '/use Illuminate\\\\Support\\\\Facades\\\\DB;/',
            '/use Illuminate\\\\Database\\\\Eloquent\\\\Model;/',
            '/DB::table\s*\(/',
            '/->(?:insert|insertGetId|upsert|update|save|saveOrFail)\s*\(/',
            '/::(?:create|updateOrCreate|firstOrCreate|upsert)\s*\(/',
        ];
        $violations = [];

        foreach ($files as $file) {
            $relative = str_replace('\\', '/', substr($file->getPathname(), strlen($root) + 1));
            $text = (string) file_get_contents($file->getPathname());
            foreach ($patterns as $pattern) {
                if ($relative === 'System/Host/TitanHostMenuCompatibilityAdapter.php' && str_contains($pattern, 'insert|insertGetId|upsert|update|save|saveOrFail')) continue;
                if (preg_match($pattern, $text) === 1) {
                    $violations[] = $file->getFilename() . ': ' . $pattern;
                }
            }
        }

        self::assertSame([], $violations, implode("\n", $violations));
    }

    public function test_manifest_declares_no_owned_business_tables_or_migrations(): void
    {
        $manifest = json_decode(
            (string) file_get_contents(dirname(__DIR__, 2) . '/extension.manifest.json'),
            true,
            512,
            JSON_THROW_ON_ERROR,
        );

        self::assertFalse($manifest['database']['migrations']);
        self::assertSame([], $manifest['database']['owned_tables']);
        self::assertSame(['menus'], $manifest['database']['shared_tables']);
    }
}
