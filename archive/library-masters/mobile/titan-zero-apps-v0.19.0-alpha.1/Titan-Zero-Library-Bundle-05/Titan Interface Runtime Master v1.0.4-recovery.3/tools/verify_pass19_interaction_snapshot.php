<?php

declare(strict_types=1);
$root=$argv[1]??'';if($root===''||!is_dir($root))throw new RuntimeException('Interaction Engine snapshot path is required.');
function i19(bool $ok,string $m):void{if(!$ok)throw new RuntimeException($m);}
$sync=$root.'/System/Offline/SyncEngine.php';
$types=$root.'/resources/ts/offline/types.ts';
$routes=$root.'/routes/api.php';
$resolver=$root.'/System/Offline/ConflictResolver.php';
$contract=$root.'/System/Contracts/ConflictResolverInterface.php';
i19(is_file($sync)&&is_file($types)&&is_file($routes)&&is_file($resolver)&&is_file($contract),'Interaction Engine offline source files are missing.');
$s=(string)file_get_contents($sync);$t=(string)file_get_contents($types);$r=(string)file_get_contents($routes);$c=(string)file_get_contents($resolver);$k=(string)file_get_contents($contract);
i19(str_contains($s,'public function getStatus(string $companyId): array'),'Interaction Engine does not expose company-scoped sync status.');
i19(str_contains($s,"'synced'")&&str_contains($s,"'conflicts'")&&str_contains($s,"'failed'"),'Expected Interaction Engine sync result states are missing.');
i19(str_contains($s,'$this->conflictResolver->resolve($command)'),'SyncEngine no longer delegates conflict decisions to source-owned resolver.');
i19(str_contains($t,"'pending' | 'syncing' | 'synced' | 'conflict' | 'failed'")&&str_contains($t,"syncStatus: 'local' | 'syncing' | 'synced' | 'conflict'"),'Offline client state contract is missing expected states.');
i19(str_contains($c,"'version_mismatch'")&&str_contains($c,"'deleted_entity'")&&str_contains($c,"'prompt_user'")&&str_contains($c,"'execute'"),'Current ConflictResolver strategies are missing.');
i19(str_contains($k,'function resolve(array $command): array'),'ConflictResolverInterface source contract changed.');
i19(str_contains($r,'sync')||str_contains($r,'offline'),'Interaction Engine API routes no longer expose sync/offline surface.');
echo "PASS 19 INTERACTION SNAPSHOT: Interaction Engine 10.12.0 retains company-scoped sync, offline states and source-owned conflict resolution\n";
