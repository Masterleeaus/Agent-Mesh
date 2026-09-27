<?php

declare(strict_types=1);

namespace App\Extensions\InteractionEngine\System\Commands;

use App\Extensions\InteractionEngine\System\InteractionEngineServiceProvider;
use Illuminate\Console\Command;

final class InstallCommand extends Command
{
    protected $signature = 'interaction-engine:install {--force : Replace published configuration} {--no-migrate : Skip database migrations}';
    protected $description = 'Install and verify the Titan Zero Interaction Engine extension';

    public function handle(): int
    {
        $publishOptions = [
            '--provider' => InteractionEngineServiceProvider::class,
            '--tag' => 'extension',
        ];
        if ($this->option('force')) {
            $publishOptions['--force'] = true;
        }

        $this->call('vendor:publish', $publishOptions);
        $this->call('interaction-engine:seed', $this->option('force') ? ['--force' => true] : []);

        if (!$this->option('no-migrate')) {
            $this->call('migrate', ['--force' => true]);
        }

        $status = $this->call('interaction-engine:health');
        if ($status !== self::SUCCESS) {
            $this->error('Installation completed, but health checks failed. Review the output above.');
            return self::FAILURE;
        }
        $this->info('Titan Zero Interaction Engine extension installed successfully.');
        return self::SUCCESS;
    }
}
