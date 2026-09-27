<?php

declare(strict_types=1);

$root = dirname(__DIR__, 2);
require_once $root.'/System/Mcp/Support/PathGuard.php';
require_once $root.'/System/Mcp/Support/BackupRetentionManager.php';
require_once $root.'/System/Mcp/Support/BackupManager.php';

use App\Extensions\TitanMcp\System\Mcp\Support\BackupManager;
use App\Extensions\TitanMcp\System\Mcp\Support\PathGuard;

$tmp=sys_get_temp_dir().'/titan-mcp-drift-'.bin2hex(random_bytes(5));
mkdir($tmp.'/app/sub',0755,true); mkdir($tmp.'/storage/app/titan-mcp/backups/filesystem',0700,true);
file_put_contents($tmp.'/app/sub/a.php',"A\n");
$guard=new PathGuard($tmp,['app'],[],[]);
$backups=new BackupManager($tmp,$tmp.'/storage/app/titan-mcp/backups/filesystem',$guard);
$backup=$backups->backupPaths(['app/sub'],['operation'=>'ticket_prepare_test']);
$match=$backups->matchesCurrent($backup['backup_id']);
if(($match['matches']??false)!==true) throw new RuntimeException('Fresh prepared backup did not match current state.');
file_put_contents($tmp.'/app/sub/a.php',"B\n");
$drift=$backups->matchesCurrent($backup['backup_id']);
if(($drift['matches']??true)!==false || ($drift['errors']??[])===[]) throw new RuntimeException('Prepared backup drift was not detected.');

function rrmdir2(string $path):void{if(!is_dir($path))return;$it=new RecursiveIteratorIterator(new RecursiveDirectoryIterator($path,FilesystemIterator::SKIP_DOTS),RecursiveIteratorIterator::CHILD_FIRST);foreach($it as $f){$f->isDir()?rmdir($f->getPathname()):unlink($f->getPathname());}rmdir($path);} rrmdir2($tmp);
echo "Titan MCP prepared backup drift detection: PASS\n";
