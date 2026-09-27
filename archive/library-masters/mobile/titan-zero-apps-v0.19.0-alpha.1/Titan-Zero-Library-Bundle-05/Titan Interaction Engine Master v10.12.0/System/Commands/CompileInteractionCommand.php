<?php

declare(strict_types=1);

namespace App\Extensions\InteractionEngine\System\Commands;

use Illuminate\Console\Command;
use App\Extensions\InteractionEngine\System\Compiler\InteractionCompiler;
use App\Extensions\InteractionEngine\System\Registry\InteractionRegistry;

class CompileInteractionCommand extends Command
{
    protected $signature = 'interaction-engine:compile {id?}';
    protected $description = 'Compile interaction definitions';

    public function handle(InteractionCompiler $compiler, InteractionRegistry $registry)
    {
        $id = $this->argument('id');
        if ($id) {
            $this->info("Compiling definition: $id");
            $definition = $compiler->compile($id);
            $this->info("Compiled successfully. Name: {$definition->name}");
        } else {
            $this->info("Compiling all definitions...");
            $all = $registry->all();
            $this->info("Compiled " . count($all) . " definitions.");
        }
    }
}
