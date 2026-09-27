<?php

declare(strict_types=1);

namespace App\Extensions\TitanMcp\System\Mcp\Support;

use Illuminate\Console\Scheduling\Schedule;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Throwable;

final class OperationsInspector
{
    public function __construct(private readonly SecretRedactor $redactor) {}

    public function configSearch(string $query = '', int $limit = 100): array
    {
        $limit = min(max($limit, 1), 250);
        $query = mb_strtolower(trim($query));
        $flat = [];
        $this->flattenConfig((array) config()->all(), '', $flat);
        ksort($flat, SORT_NATURAL | SORT_FLAG_CASE);

        $matches = [];
        foreach ($flat as $key => $value) {
            if ($query !== '' && !str_contains(mb_strtolower($key), $query)) continue;
            $matches[] = ['key' => $key, 'value' => $this->redactor->redact($value, $key)];
            if (count($matches) >= $limit) break;
        }

        $total = 0;
        foreach (array_keys($flat) as $key) {
            if ($query === '' || str_contains(mb_strtolower($key), $query)) $total++;
        }

        return ['query'=>$query, 'total'=>$total, 'returned'=>count($matches), 'truncated'=>$total>count($matches), 'items'=>$matches];
    }

    public function migrationsStatus(int $limit = 250): array
    {
        $limit = min(max($limit, 1), 1000);
        $files = $this->migrationFiles();
        $ran = [];
        $tableReady = false;
        try {
            $tableReady = Schema::hasTable('migrations');
            if ($tableReady) $ran = app(\Illuminate\Database\DatabaseManager::class)->table('migrations')->orderBy('batch')->orderBy('migration')->pluck('batch', 'migration')->all();
        } catch (Throwable) {
            $tableReady = false;
        }

        $items = [];
        foreach ($files as $name => $relative) {
            $items[] = [
                'migration' => $name,
                'path' => $relative,
                'ran' => array_key_exists($name, $ran),
                'batch' => array_key_exists($name, $ran) ? (int) $ran[$name] : null,
            ];
        }
        usort($items, static fn(array $a, array $b): int => strnatcasecmp($a['migration'], $b['migration']) ?: strcmp($a['migration'], $b['migration']));
        $pending = count(array_filter($items, static fn(array $row): bool => !$row['ran']));

        return [
            'migration_table_ready'=>$tableReady,
            'files'=>count($items),
            'ran'=>count($items)-$pending,
            'pending'=>$pending,
            'returned'=>min(count($items),$limit),
            'truncated'=>count($items)>$limit,
            'items'=>array_slice($items,0,$limit),
        ];
    }

    public function queueStatus(): array
    {
        $default = (string) config('queue.default', 'sync');
        $connection = (array) config('queue.connections.'.$default, []);
        $driver = (string) ($connection['driver'] ?? 'unknown');
        $result = ['default'=>$default, 'driver'=>$driver, 'pending'=>null, 'failed'=>null, 'tables'=>[]];

        $jobsTable = is_string($connection['table'] ?? null) ? (string) $connection['table'] : null;
        $failedTable = (string) config('queue.failed.table', 'failed_jobs');
        foreach ([['pending',$jobsTable],['failed',$failedTable]] as [$key,$table]) {
            if (!is_string($table) || $table === '' || preg_match('/^[A-Za-z0-9_]+$/D',$table)!==1) continue;
            try {
                $exists = Schema::hasTable($table);
                $result['tables'][$key] = ['table'=>$table,'exists'=>$exists];
                if ($exists) $result[$key] = (int) app(\Illuminate\Database\DatabaseManager::class)->table($table)->count();
            } catch (Throwable $e) {
                $result['tables'][$key] = ['table'=>$table,'exists'=>false,'error'=>'unavailable'];
            }
        }
        return $result;
    }

    public function schedulerList(int $limit = 200): array
    {
        $limit = min(max($limit,1),500);
        $items = [];
        try {
            $schedule = app(Schedule::class);
            foreach ($schedule->events() as $event) {
                $summary = method_exists($event,'getSummaryForDisplay') ? (string) $event->getSummaryForDisplay() : get_class($event);
                $items[] = [
                    'expression'=>(string)($event->expression ?? ''),
                    'summary'=>$summary,
                    'timezone'=>$event->timezone ?? null,
                    'description'=>$event->description ?? null,
                    'without_overlapping'=>(bool)($event->withoutOverlapping ?? false),
                    'on_one_server'=>(bool)($event->onOneServer ?? false),
                ];
            }
        } catch (Throwable $e) {
            return ['available'=>false,'total'=>0,'returned'=>0,'truncated'=>false,'items'=>[],'error'=>'scheduler_unavailable'];
        }
        usort($items, static fn(array $a,array $b): int => strcmp($a['expression'].'|'.$a['summary'],$b['expression'].'|'.$b['summary']));
        return ['available'=>true,'total'=>count($items),'returned'=>min(count($items),$limit),'truncated'=>count($items)>$limit,'items'=>array_slice($items,0,$limit)];
    }

    public function permissionsSummary(): array
    {
        $result = ['permissions_table'=>false,'roles_table'=>false,'mcp_permissions'=>0,'roles'=>[]];
        try {
            $result['permissions_table'] = Schema::hasTable('permissions');
            $result['roles_table'] = Schema::hasTable('roles');
            if (!$result['permissions_table']) return $result;
            $permissions = app(\Illuminate\Database\DatabaseManager::class)->table('permissions')->where(function($q): void {
                $q->where('name','like','titan.mcp.%')->orWhere('name','like','titan_mcp%');
            })->orderBy('name')->limit(250)->get(['id','name','guard_name']);
            $result['mcp_permissions'] = $permissions->count();
            $result['permissions'] = $permissions->map(static fn($p): array => ['name'=>(string)$p->name,'guard'=>(string)$p->guard_name])->values()->all();

            if ($result['roles_table'] && Schema::hasTable('role_has_permissions')) {
                $ids = $permissions->pluck('id')->map(static fn($v)=>(int)$v)->all();
                if ($ids !== []) {
                    $rows = app(\Illuminate\Database\DatabaseManager::class)->table('roles as r')->leftJoin('role_has_permissions as rp','rp.role_id','=','r.id')
                        ->whereIn('rp.permission_id',$ids)->groupBy('r.id','r.name','r.guard_name')
                        ->orderBy('r.name')->limit(100)->selectRaw('r.name, r.guard_name, COUNT(DISTINCT rp.permission_id) as granted')->get();
                    $result['roles'] = $rows->map(static fn($r): array => ['name'=>(string)$r->name,'guard'=>(string)$r->guard_name,'mcp_permissions'=>(int)$r->granted])->values()->all();
                }
            }
        } catch (Throwable) {
            $result['error'] = 'permission_store_unavailable';
        }
        return $result;
    }

    /** @param array<string,mixed> $values @param array<string,mixed> $flat */
    private function flattenConfig(array $values, string $prefix, array &$flat): void
    {
        foreach ($values as $key => $value) {
            $path = $prefix === '' ? (string)$key : $prefix.'.'.$key;
            if (is_array($value)) {
                if ($value === []) $flat[$path] = [];
                else $this->flattenConfig($value,$path,$flat);
                continue;
            }
            if (is_object($value) || is_resource($value)) $flat[$path] = '<'.get_debug_type($value).'>';
            else $flat[$path] = $value;
        }
    }

    /** @return array<string,string> */
    private function migrationFiles(): array
    {
        $result = [];
        $patterns = [base_path('database/migrations/*.php'), base_path('app/Extensions/*/database/migrations/*.php')];
        foreach ($patterns as $pattern) {
            foreach ((array) glob($pattern) as $path) {
                if (!is_file($path)) continue;
                $name = pathinfo($path, PATHINFO_FILENAME);
                $relative = str_replace('\\','/',substr($path,strlen(base_path())+1));
                if (!isset($result[$name]) || strcmp($relative,$result[$name])<0) $result[$name]=$relative;
            }
        }
        return $result;
    }
}
