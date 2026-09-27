<?php

declare(strict_types=1);

$root = dirname(__DIR__, 2);
require_once $root.'/System/Mcp/Support/PathGuard.php';
require_once $root.'/System/Mcp/Support/BackupRetentionManager.php';
require_once $root.'/System/Mcp/Support/BackupManager.php';
require_once $root.'/System/Mcp/Support/AuditLogger.php';
require_once $root.'/System/Mcp/Support/MutationService.php';

use App\Extensions\TitanMcp\System\Mcp\Support\BackupManager;
use App\Extensions\TitanMcp\System\Mcp\Support\MutationService;
use App\Extensions\TitanMcp\System\Mcp\Support\PathGuard;

$tmp = sys_get_temp_dir().'/titan-mcp-v13-'.bin2hex(random_bytes(5));
mkdir($tmp.'/app', 0755, true);
mkdir($tmp.'/storage/app/titan-mcp/backups/filesystem', 0700, true);
file_put_contents($tmp.'/app/a.php', "old-a\n");
$guard = new PathGuard($tmp, ['app'], [], []);
$backups = new BackupManager($tmp, $tmp.'/storage/app/titan-mcp/backups/filesystem', $guard);
$mutations = new MutationService($tmp, $guard, $backups, null, 1024 * 1024);

$batch = $mutations->batchWriteFiles([
    ['path'=>'app/a.php','content'=>"new-a\n",'expected_sha256'=>hash('sha256', "old-a\n")],
    ['path'=>'app/b.php','content'=>"new-b\n"],
], ['tool'=>'test','reason'=>'batch recovery test']);
if (($batch['count'] ?? 0) !== 2 || !is_string($batch['backup_id'] ?? null)) throw new RuntimeException('Batch result missing backup evidence.');
if (file_get_contents($tmp.'/app/a.php') !== "new-a\n" || file_get_contents($tmp.'/app/b.php') !== "new-b\n") throw new RuntimeException('Batch write did not commit expected bytes.');
$backups->restore($batch['backup_id']);
if (file_get_contents($tmp.'/app/a.php') !== "old-a\n" || file_exists($tmp.'/app/b.php')) throw new RuntimeException('Batch backup did not restore exact pre-write state.');

$replace = $mutations->replaceText('app/a.php', 'old-a', 'replaced-a', 1, hash('sha256', "old-a\n"), ['tool'=>'test','reason'=>'replace recovery test']);
if (!is_string($replace['backup_id'] ?? null) || file_get_contents($tmp.'/app/a.php') !== "replaced-a\n") throw new RuntimeException('Exact replace failed.');
$backups->restore($replace['backup_id']);
if (file_get_contents($tmp.'/app/a.php') !== "old-a\n") throw new RuntimeException('Replace backup did not restore file.');

$mkdir = $mutations->makeDirectory('app/newdir', ['tool'=>'test','reason'=>'mkdir recovery test']);
if (!is_dir($tmp.'/app/newdir') || !is_string($mkdir['backup_id'] ?? null)) throw new RuntimeException('Governed mkdir failed.');
$backups->restore($mkdir['backup_id']);
if (file_exists($tmp.'/app/newdir')) throw new RuntimeException('Mkdir backup did not restore missing state.');

function rrmdir(string $path): void { if (!is_dir($path)) return; $it=new RecursiveIteratorIterator(new RecursiveDirectoryIterator($path,FilesystemIterator::SKIP_DOTS),RecursiveIteratorIterator::CHILD_FIRST); foreach($it as $f){$f->isDir()?rmdir($f->getPathname()):unlink($f->getPathname());} rmdir($path); }
rrmdir($tmp);
echo "Titan MCP coding write recovery: PASS\n";
