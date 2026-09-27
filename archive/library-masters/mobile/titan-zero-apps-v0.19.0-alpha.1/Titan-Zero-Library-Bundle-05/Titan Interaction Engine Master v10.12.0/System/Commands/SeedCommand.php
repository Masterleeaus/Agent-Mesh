<?php

declare(strict_types=1);

namespace App\Extensions\InteractionEngine\System\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\File;

final class SeedCommand extends Command
{
    protected $signature = 'interaction-engine:seed {--force : Replace existing definitions}';
    protected $description = 'Install the bundled interaction and universal wizard definitions';

    public function handle(): int
    {
        $copied = 0;
        $copied += $this->copyDefinitions(
            dirname(__DIR__, 2) . '/resources/interactions',
            (string) config('interaction-engine.definitions_path'),
        );
        $copied += $this->copyDefinitions(
            dirname(__DIR__, 2) . '/resources/wizards',
            (string) config('interaction-engine.wizard.definitions_path'),
        );
        $copied += $this->copyDefinitions(
            dirname(__DIR__, 2) . '/resources/templates',
            (string) config('interaction-engine.template.definitions_path'),
        );
        $this->info("Installed {$copied} definition files.");
        return self::SUCCESS;
    }

    private function copyDefinitions(string $source, string $destination): int
    {
        File::ensureDirectoryExists($destination);
        $sourceReal = realpath($source);
        $destinationReal = realpath($destination);
        if ($sourceReal !== false && $destinationReal !== false && $sourceReal === $destinationReal) {
            return 0;
        }
        $copied = 0;
        foreach (File::files($source) as $file) {
            if (!in_array(strtolower($file->getExtension()), ['json', 'yaml', 'yml'], true)) {
                continue;
            }
            $target = rtrim($destination, DIRECTORY_SEPARATOR) . DIRECTORY_SEPARATOR . $file->getFilename();
            if (File::exists($target) && !$this->option('force')) {
                $this->line("Skipped existing {$target}");
                continue;
            }
            File::copy($file->getPathname(), $target);
            $copied++;
        }
        return $copied;
    }
}
