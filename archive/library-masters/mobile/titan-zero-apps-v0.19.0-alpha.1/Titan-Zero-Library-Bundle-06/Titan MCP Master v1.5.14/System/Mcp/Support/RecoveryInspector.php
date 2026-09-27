<?php

declare(strict_types=1);

namespace App\Extensions\TitanMcp\System\Mcp\Support;

use Throwable;

final class RecoveryInspector
{
    public function __construct(
        private readonly BackupManager $filesystem,
        private readonly DatabaseBackupManager $database,
        private readonly AuditLogger $audit,
        private readonly SecretRedactor $redactor,
    ) {}

    public function auditStatus(): array
    {
        $status = $this->audit->verifyIntegrity();
        $path = storage_path('logs/titan-mcp-audit.jsonl');
        $status['exists'] = is_file($path);
        $status['bytes'] = is_file($path) ? (int) (@filesize($path) ?: 0) : 0;
        return $status;
    }

    public function backupsList(string $type = 'all', int $limit = 100): array
    {
        $type = strtolower(trim($type));
        if (!in_array($type,['all','filesystem','database'],true)) throw new \InvalidArgumentException('Backup type must be all, filesystem, or database.');
        $limit = min(max($limit,1),250);
        $items = [];
        if ($type !== 'database') $this->collect('filesystem',storage_path('app/titan-mcp/backups/filesystem'),$this->filesystem,$items);
        if ($type !== 'filesystem') $this->collect('database',storage_path('app/titan-mcp/backups/database'),$this->database,$items);
        usort($items, static fn(array $a,array $b): int => strcmp((string)$b['backup_id'],(string)$a['backup_id']));
        return ['type'=>$type,'total'=>count($items),'returned'=>min(count($items),$limit),'truncated'=>count($items)>$limit,'items'=>array_slice($items,0,$limit)];
    }

    /** @param BackupManager|DatabaseBackupManager $manager @param list<array<string,mixed>> $items */
    private function collect(string $type,string $root,object $manager,array &$items): void
    {
        if (!is_dir($root) || is_link($root)) return;
        $entries = scandir($root);
        if (!is_array($entries)) return;
        foreach ($entries as $id) {
            if ($id==='.'||$id==='..'||preg_match('/^[A-Za-z0-9_-]+$/D',$id)!==1) continue;
            $dir=$root.DIRECTORY_SEPARATOR.$id;
            if (!is_dir($dir)||is_link($dir)) continue;
            try {
                $verification=$manager->verify($id);
                $manifest=$manager->manifest($id);
                $items[]=$this->redactor->redact([
                    'type'=>$type,
                    'backup_id'=>$id,
                    'created_at'=>$manifest['created_at']??null,
                    'valid'=>(bool)($verification['valid']??false),
                    'errors'=>$verification['errors']??[],
                    'metadata'=>$manifest['metadata']??[],
                ]);
            } catch (Throwable $e) {
                $items[]=['type'=>$type,'backup_id'=>$id,'created_at'=>null,'valid'=>false,'errors'=>['unreadable_backup'],'metadata'=>[]];
            }
        }
    }
}
