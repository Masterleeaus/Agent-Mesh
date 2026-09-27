<?php

declare(strict_types=1);

namespace App\Extensions\TitanMcp\System\Mcp\Support;

use InvalidArgumentException;
use RuntimeException;

final class MutationPreparationService
{
    private const SUPPORTED = [
        'titan_repository_write','titan_repository_replace','titan_repository_batch_write','titan_repository_mkdir',
        'titan_repository_delete','titan_repository_rollback','titan_database_mutate','titan_database_rollback','titan_artisan_mutate',
    ];

    public function __construct(
        private readonly MutationTicketStore $tickets,
        private readonly MutationService $filesystemMutations,
        private readonly BackupManager $filesystemBackups,
        private readonly DatabaseBackupManager $databaseBackups,
        private readonly DatabaseWritePolicy $databaseWritePolicy,
        private readonly SqlGuard $sqlGuard,
        private readonly CommandExecutionPolicy $commandPolicy,
        private readonly PathGuard $pathGuard,
        private readonly AuditLogger $audit,
    ) {}

    public function supports(string $tool): bool { return in_array($tool, self::SUPPORTED, true); }

    /** @param array<string,mixed> $arguments @param array<string,mixed> $metadata @return array<string,mixed> */
    public function prepare(string $tool, array $arguments, string|int|null $actorId, array $metadata, int $ttlSeconds): array
    {
        $this->audit->assertReady();
        if (!$this->supports($tool)) throw new InvalidArgumentException("Tool '{$tool}' does not support coordinated mutation tickets.");
        $this->validatePreconditions($tool, $arguments);
        $ttl = max(60, min((int) config('titan_mcp.mutation_tickets.max_ttl_seconds', 900), $ttlSeconds));
        $now = time();
        $canonicalArguments = $this->canonicalJson($arguments);
        if (strlen($canonicalArguments) > max(4096, (int) config('titan_mcp.mutation_tickets.max_argument_bytes', 12582912))) {
            throw new InvalidArgumentException('Mutation ticket arguments exceed the configured maximum serialized size.');
        }
        $argsHash = hash('sha256', $canonicalArguments);
        $prepared = $this->createPreapprovalBackups($tool, $arguments, $metadata + [
            'operation'=>'mutation_ticket_prepare', 'intended_tool'=>$tool, 'arguments_sha256'=>$argsHash,
        ]);
        $ticket = $this->tickets->create([
            'schema'=>'titan-mcp-mutation-ticket/1',
            'status'=>'prepared',
            'single_use'=>true,
            'actor_id'=>$actorId === null ? null : (string) $actorId,
            'tool'=>$tool,
            'arguments'=>$arguments,
            'arguments_sha256'=>$argsHash,
            'targets'=>$prepared['targets'],
            'preapproval_backups'=>$prepared['backups'],
            'prepared_at'=>gmdate('c', $now),
            'expires_at'=>gmdate('c', $now + $ttl),
            'expires_at_epoch'=>$now + $ttl,
            'run_id'=>$metadata['run_id'] ?? null,
            'request_id'=>$metadata['request_id'] ?? null,
        ]);
        try {
            $this->audit->record('mutation_ticket.prepared', $metadata + [
                'ticket_id'=>$ticket['ticket_id'], 'tool'=>$tool, 'arguments_sha256'=>$argsHash,
                'targets'=>$prepared['targets'], 'preapproval_backups'=>$prepared['backups'], 'expires_at'=>$ticket['expires_at'],
            ]);
        } catch (\Throwable $e) {
            $this->tickets->replace((string) $ticket['ticket_id'], array_replace($ticket, ['status'=>'failed_audit','failed_at'=>gmdate('c'),'error'=>'Preparation audit commit failed.']));
            throw $e;
        }
        return $this->publicView($ticket);
    }

    /** @return array<string,mixed> */
    public function assertCommittable(string $ticketId, string|int|null $actorId): array
    {
        $ticket = $this->tickets->read($ticketId);
        if (($ticket['status'] ?? null) !== 'prepared') throw new RuntimeException('Mutation ticket is not prepared or has already been consumed.');
        if ((string) ($ticket['actor_id'] ?? '') !== (string) ($actorId ?? '')) throw new RuntimeException('Mutation ticket belongs to a different actor.');
        if ((int) ($ticket['expires_at_epoch'] ?? 0) < time()) throw new RuntimeException('Mutation ticket has expired.');
        if (!hash_equals((string) ($ticket['arguments_sha256'] ?? ''), hash('sha256', $this->canonicalJson((array) ($ticket['arguments'] ?? []))))) {
            throw new RuntimeException('Mutation ticket argument binding failed.');
        }
        foreach ((array) ($ticket['preapproval_backups'] ?? []) as $backup) {
            if (!is_array($backup)) throw new RuntimeException('Mutation ticket backup evidence is invalid.');
            $id = (string) ($backup['backup_id'] ?? '');
            $type = (string) ($backup['type'] ?? '');
            $verified = $type === 'database' ? $this->databaseBackups->verify($id) : $this->filesystemBackups->verify($id);
            if (($verified['valid'] ?? false) !== true) throw new RuntimeException("Prepared {$type} backup '{$id}' no longer verifies; commit blocked.");
            if ($type === 'filesystem') {
                $state = $this->filesystemBackups->matchesCurrent($id);
                if (($state['matches'] ?? false) !== true) {
                    throw new RuntimeException("Filesystem state changed after mutation preparation for backup '{$id}'; prepare a fresh ticket before approval/commit.");
                }
            }
        }
        return $ticket;
    }

    /** @return array<string,mixed> */
    public function assertOwned(string $ticketId, string|int|null $actorId): array
    {
        $ticket = $this->tickets->read($ticketId);
        if ((string) ($ticket['actor_id'] ?? '') !== (string) ($actorId ?? '')) throw new RuntimeException('Mutation ticket belongs to a different actor.');
        return $ticket;
    }

    /** @return array<string,mixed> */
    public function markCommitting(string $ticketId): array
    {
        $ticket = $this->tickets->transition($ticketId, 'prepared', ['status'=>'committing','commit_started_at'=>gmdate('c')]);
        $this->safeAudit('mutation_ticket.committing', ['ticket_id'=>$ticketId,'actor_id'=>$ticket['actor_id']??null,'tool'=>$ticket['tool']??null,'arguments_sha256'=>$ticket['arguments_sha256']??null]);
        return $ticket;
    }

    /** @param array<string,mixed> $result @return array<string,mixed> */
    public function markCommitted(string $ticketId, array $result): array
    {
        $current = $this->tickets->read($ticketId);
        $evidence = $this->collectMutationBackupEvidence((string) ($current['tool'] ?? ''), $result);
        $ticket = $this->tickets->transition($ticketId, 'committing', [
            'status'=>'committed','committed_at'=>gmdate('c'),'result_sha256'=>hash('sha256', $this->canonicalJson($result)),
            'mutation_backups'=>$evidence,
        ]);
        // The canonical mutation tool has already durably audited/compensated its own write.
        // Ticket-ledger audit is supplemental and must never turn a successful committed mutation into a false failure.
        $this->safeAudit('mutation_ticket.committed', ['ticket_id'=>$ticketId,'actor_id'=>$ticket['actor_id']??null,'tool'=>$ticket['tool']??null,'arguments_sha256'=>$ticket['arguments_sha256']??null,'result_sha256'=>$ticket['result_sha256']??null,'preapproval_backups'=>$ticket['preapproval_backups']??[],'mutation_backups'=>$evidence]);
        return $ticket;
    }

    /** @return array<string,mixed> */
    public function markFailed(string $ticketId, string $message): array
    {
        try {
            $ticket = $this->tickets->transition($ticketId, 'committing', [
                'status'=>'failed','failed_at'=>gmdate('c'),'error'=>substr($message, 0, 1000),
            ]);
            $this->safeAudit('mutation_ticket.failed', ['ticket_id'=>$ticketId,'actor_id'=>$ticket['actor_id']??null,'tool'=>$ticket['tool']??null,'arguments_sha256'=>$ticket['arguments_sha256']??null,'error'=>substr($message,0,1000)]);
            return $ticket;
        } catch (\Throwable) {
            return $this->tickets->read($ticketId);
        }
    }

    /** @return array<string,mixed> */
    public function publicView(array $ticket): array
    {
        return [
            'ticket_id'=>$ticket['ticket_id'] ?? null,
            'status'=>$ticket['status'] ?? null,
            'single_use'=>(bool) ($ticket['single_use'] ?? true),
            'tool'=>$ticket['tool'] ?? null,
            'arguments_sha256'=>$ticket['arguments_sha256'] ?? null,
            'targets'=>$ticket['targets'] ?? [],
            'backup_domains'=>$this->backupDomains((array)($ticket['preapproval_backups'] ?? [])),
            'preapproval_backups'=>$ticket['preapproval_backups'] ?? [],
            'mutation_backups'=>$ticket['mutation_backups'] ?? [],
            'approval_evidence'=>$this->approvalEvidence($ticket),
            'prepared_at'=>$ticket['prepared_at'] ?? null,
            'expires_at'=>$ticket['expires_at'] ?? null,
            'commit_started_at'=>$ticket['commit_started_at'] ?? null,
            'committed_at'=>$ticket['committed_at'] ?? null,
            'failed_at'=>$ticket['failed_at'] ?? null,
            'result_sha256'=>$ticket['result_sha256'] ?? null,
            'run_id'=>$ticket['run_id'] ?? null,
            'request_id'=>$ticket['request_id'] ?? null,
        ];
    }

    /** @param array<string,mixed> $arguments */
    private function validatePreconditions(string $tool, array $arguments): void
    {
        if (in_array($tool, ['titan_repository_write','titan_repository_replace','titan_repository_mkdir','titan_repository_delete'], true)) {
            $path = $this->requiredString($arguments, 'path');
            $relative = $this->pathGuard->normalizeRelative($path);
            $target = $this->pathGuard->resolve($relative);
            if ($tool === 'titan_repository_mkdir') {
                if (file_exists($target) || is_link($target)) throw new RuntimeException("Directory target '{$relative}' already exists.");
                return;
            }
            if ($tool === 'titan_repository_delete') {
                if (!file_exists($target) && !is_link($target)) throw new RuntimeException("Delete target '{$relative}' does not exist.");
                return;
            }
            $expected = $arguments['expectedSha256'] ?? null;
            if ($expected !== null) {
                if (!is_string($expected) || preg_match('/^[a-f0-9]{64}$/i', $expected) !== 1) throw new InvalidArgumentException('expectedSha256 must be a 64-character SHA-256 digest.');
                if (!is_file($target) || is_link($target)) throw new RuntimeException('Optimistic concurrency check failed; expected target file is missing.');
                $actual = hash_file('sha256', $target);
                if (!is_string($actual) || !hash_equals(strtolower($expected), strtolower($actual))) throw new RuntimeException('Optimistic concurrency check failed; target file changed.');
            }
            if ($tool === 'titan_repository_replace') {
                if (!is_file($target) || is_link($target)) throw new RuntimeException('Repository replace requires an existing regular file.');
                $search = $this->requiredString($arguments, 'search');
                $expectedOccurrences = $arguments['expectedOccurrences'] ?? 1;
                if (!is_int($expectedOccurrences) || $expectedOccurrences < 1 || $expectedOccurrences > 1000) throw new InvalidArgumentException('expectedOccurrences must be between 1 and 1000.');
                $content = file_get_contents($target);
                if (!is_string($content)) throw new RuntimeException('Unable to read repository replace target.');
                $found = substr_count($content, $search);
                if ($found !== $expectedOccurrences) throw new RuntimeException("Repository replace occurrence check failed; expected {$expectedOccurrences}, found {$found}.");
            }
            return;
        }
        if ($tool === 'titan_repository_batch_write') {
            $files = $arguments['files'] ?? null;
            if (!is_array($files) || $files === [] || count($files) > 50) throw new InvalidArgumentException('files must contain between 1 and 50 batch targets.');
            $seen=[]; $total=0; $limit=max(1024,(int)config('titan_mcp.repository.max_write_bytes',1048576));
            foreach ($files as $item) {
                if (!is_array($item) || !is_string($item['path'] ?? null) || !is_string($item['content'] ?? null)) throw new InvalidArgumentException('Each batch target requires string path and content.');
                $relative=$this->pathGuard->normalizeRelative($item['path']); if(isset($seen[$relative])) throw new InvalidArgumentException("Duplicate batch target '{$relative}'."); $seen[$relative]=true;
                $target=$this->pathGuard->resolve($relative); if(is_dir($target)) throw new RuntimeException("Batch target '{$relative}' is a directory.");
                $expected=$item['expected_sha256']??$item['expectedSha256']??null;
                if($expected!==null){ if(!is_string($expected)||preg_match('/^[a-f0-9]{64}$/i',$expected)!==1) throw new InvalidArgumentException("Batch target '{$relative}' has invalid expected SHA-256."); if(!is_file($target)||is_link($target)) throw new RuntimeException("Batch optimistic concurrency failed for '{$relative}'; target is missing."); $actual=hash_file('sha256',$target); if(!is_string($actual)||!hash_equals(strtolower($expected),strtolower($actual))) throw new RuntimeException("Batch optimistic concurrency failed for '{$relative}'; target changed."); }
                $bytes=strlen($item['content']); if($bytes>$limit) throw new RuntimeException("Batch target '{$relative}' exceeds the configured per-file write limit."); $total+=$bytes; if($total>$limit*10) throw new RuntimeException('Batch write exceeds the configured aggregate write limit.');
            }
            return;
        }
        if ($tool === 'titan_repository_rollback') {
            $restoreId=$this->requiredString($arguments,'backupId'); $verified=$this->filesystemBackups->verify($restoreId); if(($verified['valid']??false)!==true) throw new RuntimeException('Requested filesystem rollback backup does not verify.'); return;
        }
        if ($tool === 'titan_database_mutate') {
            $this->sqlGuard->assertMutation($this->requiredString($arguments,'sql')); return;
        }
        if ($tool === 'titan_database_rollback') {
            $restoreId=$this->requiredString($arguments,'backupId'); $verified=$this->databaseBackups->verify($restoreId); if(($verified['valid']??false)!==true) throw new RuntimeException('Requested database rollback backup does not verify.'); return;
        }
        if ($tool === 'titan_artisan_mutate') {
            $command=$this->requiredString($arguments,'command'); $commandArgs=$arguments['arguments']??[]; if(!is_array($commandArgs)) throw new InvalidArgumentException('Artisan arguments must be an array.');
            $this->commandPolicy->mutationPlan($command,$commandArgs,(array)($arguments['backupPaths']??[]),(bool)($arguments['databaseMayChange']??false)); return;
        }
    }

    /** @param array<string,mixed> $arguments @param array<string,mixed> $metadata @return array{targets:list<string>,backups:list<array<string,mixed>>} */
    private function createPreapprovalBackups(string $tool, array $arguments, array $metadata): array
    {
        $targets = [];
        $backups = [];
        if (in_array($tool, ['titan_repository_write','titan_repository_replace','titan_repository_mkdir'], true)) {
            $path = $this->requiredString($arguments, 'path');
            $scope = $this->filesystemMutations->backupScopeForPath($path);
            $backup = $this->filesystemBackups->backupPaths([$scope], $metadata + ['backup_scopes'=>[$scope]]);
            $this->assertFilesystemBackup($backup);
            $targets = [$this->pathGuard->normalizeRelative($path)];
            $backups[] = $this->filesystemEvidence($backup, 'repository');
        } elseif ($tool === 'titan_repository_batch_write') {
            $files = $arguments['files'] ?? null;
            if (!is_array($files) || $files === [] || count($files) > 50) throw new InvalidArgumentException('files must contain between 1 and 50 batch targets.');
            $scopes=[]; $seen=[];
            foreach ($files as $item) {
                if (!is_array($item) || !is_string($item['path'] ?? null)) throw new InvalidArgumentException('Each batch target requires a string path.');
                $relative=$this->pathGuard->normalizeRelative($item['path']);
                if(isset($seen[$relative])) throw new InvalidArgumentException("Duplicate batch target '{$relative}'.");
                $seen[$relative]=true; $targets[]=$relative; $scopes[$this->filesystemMutations->backupScopeForPath($relative)]=true;
            }
            $scopeList=array_keys($scopes);
            $backup=$this->filesystemBackups->backupPaths($scopeList,$metadata+['backup_scopes'=>$scopeList]);
            $this->assertFilesystemBackup($backup);
            $backups[]=$this->filesystemEvidence($backup, 'repository');
        } elseif ($tool === 'titan_repository_delete') {
            $path=$this->requiredString($arguments,'path'); $relative=$this->pathGuard->normalizeRelative($path); $this->pathGuard->resolve($relative);
            $backup=$this->filesystemBackups->backupPaths([$relative],$metadata+['backup_scopes'=>[$relative]]); $this->assertFilesystemBackup($backup);
            $targets=[$relative]; $backups[]=$this->filesystemEvidence($backup, 'repository');
        } elseif ($tool === 'titan_repository_rollback') {
            $restoreId=$this->requiredString($arguments,'backupId'); $manifest=$this->filesystemBackups->manifest($restoreId);
            $scopes=[]; foreach((array)($manifest['paths']??[]) as $entry) if(is_array($entry)&&is_string($entry['path']??null)&&$entry['path']!=='') $scopes[]=$entry['path'];
            if($scopes===[]) throw new InvalidArgumentException('Requested filesystem rollback backup has no paths.');
            $backup=$this->filesystemBackups->backupPaths($scopes,$metadata+['backup_scopes'=>$scopes,'restoring_backup_id'=>$restoreId]); $this->assertFilesystemBackup($backup);
            $targets=$scopes; $backups[]=$this->filesystemEvidence($backup, 'repository');
        } elseif ($tool === 'titan_database_mutate') {
            $sql=$this->requiredString($arguments,'sql'); $this->sqlGuard->assertMutation($sql);
            $connection=$this->databaseWritePolicy->resolve(is_string($arguments['connection']??null)?$arguments['connection']:null);
            $backup=$this->databaseBackups->backup($connection,$metadata+['connection'=>$connection]); $this->assertDatabaseBackup($backup);
            $targets=['database:'.$connection]; $backups[]=$this->databaseEvidence($backup);
        } elseif ($tool === 'titan_database_rollback') {
            $restoreId=$this->requiredString($arguments,'backupId'); $connection=$this->databaseWritePolicy->resolve($this->databaseBackups->connectionForBackup($restoreId));
            $backup=$this->databaseBackups->backup($connection,$metadata+['connection'=>$connection,'restoring_backup_id'=>$restoreId]); $this->assertDatabaseBackup($backup);
            $targets=['database:'.$connection]; $backups[]=$this->databaseEvidence($backup);
        } elseif ($tool === 'titan_artisan_mutate') {
            $command=$this->requiredString($arguments,'command'); $commandArgs=$arguments['arguments']??[]; if(!is_array($commandArgs)) throw new InvalidArgumentException('Artisan arguments must be an array.');
            $plan=$this->commandPolicy->mutationPlan($command,$commandArgs,(array)($arguments['backupPaths']??[]),(bool)($arguments['databaseMayChange']??false));
            if($plan['backup_paths']!==[]){ $backup=$this->filesystemBackups->backupPaths($plan['backup_paths'],$metadata+['backup_scopes'=>$plan['backup_paths'],'command'=>$command]); $this->assertFilesystemBackup($backup); $backups[]=$this->filesystemEvidence($backup, 'runtime'); foreach($plan['backup_paths'] as $p)$targets[]='path:'.$p; }
            if($plan['database_may_change']){ $backup=$this->databaseBackups->backup((string)$plan['database_connection'],$metadata+['connection'=>$plan['database_connection'],'command'=>$command]); $this->assertDatabaseBackup($backup); $backups[]=$this->databaseEvidence($backup); $targets[]='database:'.$plan['database_connection']; }
            if($backups===[]) throw new RuntimeException('Artisan mutation plan did not produce a verifiable backup scope.');
        }
        return ['targets'=>array_values(array_unique($targets)),'backups'=>$backups];
    }

    /** @param array<string,mixed> $backup @return array<string,mixed> */
    private function filesystemEvidence(array $backup, string $domain): array
    {
        $id=(string)($backup['backup_id']??'');
        $manifest=$this->filesystemBackups->manifest($id);
        $coverage=[];
        foreach((array)($manifest['paths']??[]) as $entry) {
            if(is_array($entry)&&is_string($entry['path']??null)&&$entry['path']!=='') $coverage[]=$entry['path'];
        }
        return [
            'type'=>'filesystem','domain'=>$domain,'backup_id'=>$id,'verified'=>true,
            'manifest_schema'=>(int)($manifest['schema']??0),
            'manifest_sha256'=>(string)($backup['manifest_sha256']??hash('sha256',$this->canonicalJson($manifest))),
            'coverage'=>array_values(array_unique($coverage)),
        ];
    }

    /** @param array<string,mixed> $backup @return array<string,mixed> */
    private function databaseEvidence(array $backup): array
    {
        $id=(string)($backup['backup_id']??'');
        $manifest=$this->databaseBackups->manifest($id);
        $connection=(string)($manifest['connection']??'');
        return [
            'type'=>'database','domain'=>'database','backup_id'=>$id,'verified'=>true,
            'manifest_schema'=>(int)($manifest['schema']??0),
            'manifest_sha256'=>(string)($backup['manifest_sha256']??hash('sha256',$this->canonicalJson($manifest))),
            'coverage'=>$connection!==''?['database:'.$connection]:['database'],
            'connection'=>$connection!==''?$connection:null,
            'target_fingerprint'=>$manifest['target_fingerprint']??null,
        ];
    }

    /** @param array<int,mixed> $backups @return list<string> */
    private function backupDomains(array $backups): array
    {
        $domains=[];
        foreach($backups as $backup) if(is_array($backup)&&is_string($backup['domain']??null)&&$backup['domain']!=='') $domains[$backup['domain']]=true;
        return array_keys($domains);
    }

    /** @param array<string,mixed> $ticket @return array<string,mixed> */
    private function approvalEvidence(array $ticket): array
    {
        $backups=(array)($ticket['preapproval_backups']??[]);
        $allVerified=$backups!==[];
        foreach($backups as $backup) if(!is_array($backup)||($backup['verified']??false)!==true) $allVerified=false;
        $arguments=(array)($ticket['arguments']??[]);
        $storedHash=(string)($ticket['arguments_sha256']??'');
        $exactBound=$storedHash!==''&&hash_equals($storedHash,hash('sha256',$this->canonicalJson($arguments)));
        return [
            'schema'=>'titan-mcp-approval-evidence/1',
            'ticket_id'=>$ticket['ticket_id']??null,
            'status'=>$ticket['status']??null,
            'tool'=>$ticket['tool']??null,
            'arguments_sha256'=>$ticket['arguments_sha256']??null,
            'exact_arguments_bound'=>$exactBound,
            'targets'=>$ticket['targets']??[],
            'backup_domains'=>$this->backupDomains($backups),
            'preapproval_backups'=>$backups,
            'all_backups_verified'=>$allVerified,
            'prepared_at'=>$ticket['prepared_at']??null,
            'expires_at'=>$ticket['expires_at']??null,
            'commit'=>['tool'=>'titan_mutation_commit','arguments'=>['ticketId'=>$ticket['ticket_id']??null]],
        ];
    }

    /** @param array<string,mixed> $backup */ private function assertFilesystemBackup(array $backup): void { $id=(string)($backup['backup_id']??''); if($id===''||($this->filesystemBackups->verify($id)['valid']??false)!==true) throw new RuntimeException('Prepared filesystem backup failed verification.'); }
    /** @param array<string,mixed> $backup */ private function assertDatabaseBackup(array $backup): void { $id=(string)($backup['backup_id']??''); if($id===''||($this->databaseBackups->verify($id)['valid']??false)!==true) throw new RuntimeException('Prepared database backup failed verification.'); }
    /** @param array<string,mixed> $arguments */ private function requiredString(array $arguments,string $key): string { $v=$arguments[$key]??null; if(!is_string($v)||trim($v)==='') throw new InvalidArgumentException("Mutation argument '{$key}' is required."); return $v; }

    /** @param array<string,mixed> $result @return list<array<string,mixed>> */
    private function collectMutationBackupEvidence(string $tool, array $result): array
    {
        $rows=[];
        $genericType = str_starts_with($tool, 'titan_database_') ? 'database' : 'filesystem';
        $rollbackType = $tool === 'titan_database_rollback' ? 'database' : 'filesystem';
        foreach ([['backup_id',$genericType],['filesystem_backup_id','filesystem'],['database_backup_id','database'],['pre_rollback_backup_id',$rollbackType]] as [$key,$type]) {
            $id=$result[$key]??null; if(!is_string($id)||$id==='') continue;
            if($type==='database') {
                $verification=$this->databaseBackups->verify($id);
                if(($verification['valid']??false)!==true){$rows[]=['type'=>'database','domain'=>'database','backup_id'=>$id,'verified'=>false];continue;}
                $rows[]=$this->databaseEvidence(['backup_id'=>$id]);
                continue;
            }
            $verification=$this->filesystemBackups->verify($id);
            if(($verification['valid']??false)!==true){$rows[]=['type'=>'filesystem','domain'=>$tool==='titan_artisan_mutate'?'runtime':'repository','backup_id'=>$id,'verified'=>false];continue;}
            $rows[]=$this->filesystemEvidence(['backup_id'=>$id], $tool==='titan_artisan_mutate'?'runtime':'repository');
        }
        return $rows;
    }

    /** @param array<string,mixed> $context */
    private function safeAudit(string $event, array $context): void
    {
        try { $this->audit->record($event, $context); } catch (\Throwable) {}
    }

    /** @param array<string,mixed> $value */
    private function canonicalJson(array $value): string
    {
        $sort=function(mixed $v) use (&$sort): mixed { if(!is_array($v)) return $v; if(!array_is_list($v)) ksort($v); foreach($v as $k=>$item)$v[$k]=$sort($item); return $v; };
        return json_encode($sort($value), JSON_UNESCAPED_SLASHES|JSON_UNESCAPED_UNICODE|JSON_THROW_ON_ERROR);
    }
}
