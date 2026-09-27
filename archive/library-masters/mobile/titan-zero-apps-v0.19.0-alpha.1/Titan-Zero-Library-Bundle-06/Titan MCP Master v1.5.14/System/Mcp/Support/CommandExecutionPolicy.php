<?php

declare(strict_types=1);

namespace App\Extensions\TitanMcp\System\Mcp\Support;

use RuntimeException;

final class CommandExecutionPolicy
{
    /** @var array<string,list<string>> */
    private const READ_ONLY_ARGUMENT_PATTERNS = [
        'about' => ['/^--json$/','/^--only=.{1,256}$/'],
        'route:list' => ['/^--json$/','/^--(?:method|name|domain|path)=.{1,512}$/','/^--except-vendor$/','/^--only-vendor$/','/^--reverse$/'],
        'migrate:status' => [],
        'event:list' => ['/^--event=.{1,512}$/'],
        'schedule:list' => ['/^--timezone=.{1,128}$/','/^--next$/'],
    ];
    /** @var list<string> */
    private const GENERIC_READ_ONLY_FLAGS = ['--ansi','--no-ansi','--no-interaction','--quiet','-q','--verbose','-v','-vv','-vvv'];

    /**
     * Only framework commands whose complete write scope Titan can derive and back up are executable.
     * Commands that execute application migrations/seeders are intentionally excluded because arbitrary PHP may
     * mutate filesystem/external state outside the database snapshot.
     * @var list<string>
     */
    private const MUTATION_COMMANDS = ['migrate:install', 'db:wipe', 'schema:dump'];

    /** @var array<string,list<string>> */
    private const MUTATION_FIXED_FLAGS = [
        'migrate:install' => ['--force'],
        'db:wipe' => ['--drop-views', '--drop-types', '--force'],
        'schema:dump' => ['--prune'],
    ];

    public function __construct(private readonly ?DatabaseWritePolicy $databaseWritePolicy = null) {}

    /** @param list<string> $arguments */
    public function assertReadonly(string $command, array $arguments): void
    {
        $this->assertCommandName($command);
        if (!array_key_exists($command, self::READ_ONLY_ARGUMENT_PATTERNS)) {
            throw new RuntimeException('Command is not in the read-only Artisan allowlist.');
        }
        $this->assertArguments($arguments, 32);
        $this->assertNoEnvironmentOverride($arguments);
        $patterns = self::READ_ONLY_ARGUMENT_PATTERNS[$command];
        foreach ($arguments as $argument) {
            if (in_array($argument, self::GENERIC_READ_ONLY_FLAGS, true)) continue;
            $matched = false;
            foreach ($patterns as $pattern) if (preg_match($pattern, $argument) === 1) { $matched = true; break; }
            if (!$matched) throw new RuntimeException("Artisan argument '{$argument}' is not allowlisted for read-only command '{$command}'.");
        }
    }

    /**
     * Caller-supplied backupPaths/databaseMayChange are retained in the public tool signature only for compatibility.
     * They never expand command authority or define backup coverage.
     * @param list<string> $arguments @param list<string> $backupPaths
     * @return array{backup_paths:list<string>,database_may_change:bool,database_connection:?string,recipe:string}
     */
    public function mutationPlan(string $command, array $arguments, array $backupPaths, bool $databaseMayChange): array
    {
        $this->assertCommandName($command);
        $this->assertArguments($arguments, 32);
        $this->assertNoEnvironmentOverride($arguments);
        if (!in_array($command, self::MUTATION_COMMANDS, true)) {
            throw new RuntimeException('Artisan mutation command is not allowlisted. Titan MCP only executes commands with a complete server-derived backup recipe.');
        }
        $this->assertMutationArguments($command, $arguments);

        $databaseOption = $this->optionValue($arguments, '--database');
        $paths = [];
        $dbChanges = false;
        $recipe = 'database-command';

        if ($command === 'migrate:install') {
            $dbChanges = true;
            $recipe = 'database-migrations-table-install';
        } elseif ($command === 'db:wipe') {
            $dbChanges = true;
            $recipe = 'database-command';
        } elseif ($command === 'schema:dump') {
            $paths[] = 'database/schema';
            if ($this->hasFlag($arguments, '--prune')) $paths[] = 'database/migrations';
            $recipe = 'schema-dump';
        }

        $connection = $dbChanges ? $this->resolveDatabaseConnection($databaseOption) : null;
        return ['backup_paths'=>array_values(array_unique($paths)),'database_may_change'=>$dbChanges,'database_connection'=>$connection,'recipe'=>$recipe];
    }

    public function isDestructiveMutation(string $command): bool { return in_array($command, self::MUTATION_COMMANDS, true); }

    /** @param list<string> $arguments */
    private function assertMutationArguments(string $command, array $arguments): void
    {
        $fixed = self::MUTATION_FIXED_FLAGS[$command] ?? [];
        $count = count($arguments);
        for ($i = 0; $i < $count; $i++) {
            $argument = $arguments[$i];
            if (in_array($argument, self::GENERIC_READ_ONLY_FLAGS, true) || in_array($argument, $fixed, true)) {
                continue;
            }
            if ($argument === '--database') {
                if (!isset($arguments[$i + 1]) || str_starts_with($arguments[$i + 1], '-')) {
                    throw new RuntimeException("Artisan option '--database' requires an explicit value.");
                }
                $value = $arguments[++$i];
                if (preg_match('/^[A-Za-z0-9_.-]{1,128}$/', $value) !== 1) {
                    throw new RuntimeException('Invalid Artisan database connection name.');
                }
                continue;
            }
            if (preg_match('/^--database=([A-Za-z0-9_.-]{1,128})$/', $argument) === 1) {
                continue;
            }
            throw new RuntimeException("Artisan argument '{$argument}' is not allowlisted for mutation command '{$command}'.");
        }
    }

    /** @param list<string> $arguments */
    private function assertNoEnvironmentOverride(array $arguments): void
    {
        foreach ($arguments as $argument) if ($argument === '--env' || str_starts_with($argument, '--env=')) throw new RuntimeException('Artisan environment override is not allowed through Titan MCP.');
    }
    /** @param list<string> $arguments */
    private function assertArguments(array $arguments, int $maximum): void
    {
        if (count($arguments) > $maximum) throw new RuntimeException('Too many Artisan command arguments.');
        foreach ($arguments as $argument) {
            if (!is_string($argument) || $argument === '' || strlen($argument) > 4096) throw new RuntimeException('Invalid Artisan command argument.');
            if (preg_match('/[\x00-\x1F\x7F]/', $argument) === 1) throw new RuntimeException('Artisan command arguments may not contain control characters.');
        }
    }
    private function assertCommandName(string $command): void
    {
        if ($command === '' || preg_match('/^[a-z0-9:_-]+$/i', $command) !== 1) throw new RuntimeException('Invalid Artisan command name.');
    }
    /** @param list<string> $arguments */
    private function optionValue(array $arguments, string $option): ?string
    {
        $found=[]; $count=count($arguments);
        for($i=0;$i<$count;$i++){
            $argument=$arguments[$i];
            if($argument===$option){ if(!isset($arguments[$i+1])||str_starts_with($arguments[$i+1],'-')) throw new RuntimeException("Artisan option '{$option}' requires an explicit value."); $found[]=$arguments[$i+1]; $i++; continue; }
            $prefix=$option.'='; if(str_starts_with($argument,$prefix)) $found[]=substr($argument,strlen($prefix));
        }
        if($found===[]) return null;
        if(count($found)!==1||trim((string)$found[0])==='') throw new RuntimeException("Artisan option '{$option}' must be supplied exactly once with a non-empty value.");
        return trim((string)$found[0]);
    }
    /** @param list<string> $arguments */ private function hasFlag(array $arguments,string $flag): bool { return in_array($flag,$arguments,true); }
    private function resolveDatabaseConnection(?string $requested): string
    {
        if($this->databaseWritePolicy!==null) return $this->databaseWritePolicy->resolve($requested);
        $default=trim((string)config('database.default','')); if($default==='') throw new RuntimeException('Laravel default database connection is not configured.');
        $connection=trim((string)($requested??$default)); if($connection!==$default) throw new RuntimeException("Database write connection '{$connection}' is not allowlisted.");
        return $connection;
    }
}
