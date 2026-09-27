<?php

declare(strict_types=1);

namespace App\Extensions\TitanMcp\System\Mcp\Support;

use RuntimeException;

final class BackupManager
{
    private string $canonicalProjectRoot;
    private string $normalizedBackupRoot;

    public function __construct(
        private readonly string $projectRoot,
        private readonly string $backupRoot,
        private readonly PathGuard $guard,
        private readonly ?BackupRetentionManager $retention = null,
    ) {
        $project = realpath($projectRoot);
        if ($project === false || !is_dir($project) || is_link($project)) {
            throw new RuntimeException('Titan MCP project root is not a canonical directory.');
        }

        $this->canonicalProjectRoot = rtrim($project, DIRECTORY_SEPARATOR);
        $this->normalizedBackupRoot = $this->normalizeAbsolutePath($backupRoot);
        if (!$this->isWithinProject($this->normalizedBackupRoot) || $this->normalizedBackupRoot === $this->canonicalProjectRoot) {
            throw new RuntimeException('Filesystem backup root must be a descendant of the Titan Zero project root.');
        }

    }

    /** @param list<string> $paths @param array<string,mixed> $metadata */
    public function backupPaths(array $paths, array $metadata = []): array
    {
        $paths = $this->normalizeScopes($paths);
        if ($paths === []) {
            throw new RuntimeException('At least one path is required for a mutation backup.');
        }

        $this->assertBackupRootPathSafe(true);
        $backupId = gmdate('Ymd_His').'_'.bin2hex(random_bytes(8));
        $dir = $this->backupDirectory($backupId, false);
        $filesDir = $dir.DIRECTORY_SEPARATOR.'files';
        if (!mkdir($dir, 0700) || !mkdir($filesDir, 0700)) {
            throw new RuntimeException('Unable to create mutation backup directory.');
        }
        @chmod($dir, 0700);
        @chmod($filesDir, 0700);

        $manifest = [
            'schema' => 3,
            'backup_id' => $backupId,
            'created_at' => gmdate(DATE_ATOM),
            'integrity' => [
                'algorithm' => 'sha256',
                'manifest_checksum' => 'manifest.sha256',
            ],
            'metadata' => $metadata,
            'paths' => [],
            'directories' => [],
            'files' => [],
        ];

        try {
            foreach ($paths as $relative) {
                $absolute = $this->guard->resolve($relative);
                $exists = file_exists($absolute) || is_link($absolute);
                $type = $exists ? (is_dir($absolute) ? 'directory' : 'file') : 'missing';
                $manifest['paths'][] = [
                    'path' => $relative,
                    'exists' => $exists,
                    'type' => $type,
                    'mode' => $exists ? $this->mode($absolute) : null,
                ];

                if (!$exists) {
                    continue;
                }
                if (is_link($absolute)) {
                    throw new RuntimeException("Refusing to back up symbolic link '{$relative}'.");
                }

                if (is_file($absolute)) {
                    $this->copyFileIntoBackup($relative, $absolute, $filesDir, $manifest);
                    continue;
                }

                $beforeTree = $this->directoryFingerprint($absolute);
                $manifest['directories'][] = ['path' => $relative, 'mode' => $this->mode($absolute)];
                $iterator = new \RecursiveIteratorIterator(
                    new \RecursiveDirectoryIterator($absolute, \FilesystemIterator::SKIP_DOTS),
                    \RecursiveIteratorIterator::SELF_FIRST
                );
                foreach ($iterator as $item) {
                    if ($item->isLink()) {
                        throw new RuntimeException("Refusing symbolic link inside backup path '{$relative}'.");
                    }
                    $itemRelative = $this->projectRelative($item->getPathname());
                    if ($item->isDir()) {
                        $destination = $filesDir.DIRECTORY_SEPARATOR.str_replace('/', DIRECTORY_SEPARATOR, $itemRelative);
                        if (!is_dir($destination) && !mkdir($destination, 0700, true) && !is_dir($destination)) {
                            throw new RuntimeException("Unable to create backup directory '{$itemRelative}'.");
                        }
                        @chmod($destination, 0700);
                        $manifest['directories'][] = ['path' => $itemRelative, 'mode' => $this->mode($item->getPathname())];
                    } else {
                        $this->copyFileIntoBackup($itemRelative, $item->getPathname(), $filesDir, $manifest);
                    }
                }
                $afterTree = $this->directoryFingerprint($absolute);
                if (!hash_equals($beforeTree, $afterTree)) {
                    throw new RuntimeException("Backup source directory '{$relative}' changed while it was being copied; inconsistent backup rejected.");
                }
            }

            $manifest['paths'] = $this->sortPathEntries($manifest['paths']);
            $manifest['directories'] = $this->uniquePathEntries($manifest['directories']);
            $manifest['files'] = $this->uniquePathEntries($manifest['files']);
            $this->validateManifestStructure($manifest);

            $manifestPath = $dir.DIRECTORY_SEPARATOR.'manifest.json';
            $checksumPath = $dir.DIRECTORY_SEPARATOR.'manifest.sha256';
            $encoded = json_encode($manifest, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES | JSON_THROW_ON_ERROR);
            $this->writeAtomicInternal($manifestPath, $encoded, 0600);
            $this->writeAtomicInternal($checksumPath, hash('sha256', $encoded)."\n", 0600);

            $verification = $this->verify($backupId);
            if (!$verification['valid']) {
                throw new RuntimeException('Mutation backup verification failed; target write is blocked: '.implode('; ', $verification['errors']));
            }

            return [
                'backup_id' => $backupId,
                'manifest' => $manifestPath,
                'manifest_sha256' => hash('sha256', $encoded),
                'valid' => true,
                'retention_cleanup' => $this->runRetentionCleanup($metadata),
            ];
        } catch (\Throwable $e) {
            $this->removeRecursively($dir);
            throw $e;
        }
    }

    /** @return array<string,mixed>|null */
    private function runRetentionCleanup(array $metadata = []): ?array
    {
        if ($this->retention === null) return null;
        try {
            $protected = [];
            foreach (['restoring_backup_id', 'prewrite_backup_id', 'backup_id'] as $key) {
                if (isset($metadata[$key]) && is_string($metadata[$key]) && $metadata[$key] !== '') $protected[] = $metadata[$key];
            }
            return $this->retention->prune(
                $this->normalizedBackupRoot,
                fn (string $id): bool => (bool) ($this->verify($id)['valid'] ?? false),
                null,
                $protected,
            );
        } catch (\Throwable $e) {
            // Retention failure must never destroy a freshly verified recovery point or block the guarded write.
            return ['enabled' => true, 'error' => $e->getMessage(), 'deleted' => []];
        }
    }

    /** @return array{valid:bool,backup_id:string,errors:list<string>} */
    public function verify(string $backupId): array
    {
        try {
            $manifest = $this->loadManifest($backupId, true);
            $dir = $this->backupDirectory($backupId, true);
            $filesDir = $dir.DIRECTORY_SEPARATOR.'files';
            $this->assertPayloadRootSafe($filesDir);
        } catch (\Throwable $e) {
            return ['valid' => false, 'backup_id' => $backupId, 'errors' => [$e->getMessage()]];
        }

        $errors = [];
        foreach ($manifest['files'] ?? [] as $file) {
            try {
                $relative = (string) $file['path'];
                $backupFile = $this->payloadPath($filesDir, $relative, true);
                if (!is_file($backupFile) || is_link($backupFile)) {
                    $errors[] = "Missing backup file {$relative}";
                    continue;
                }
                $hash = hash_file('sha256', $backupFile);
                if (!is_string($hash) || !hash_equals((string) $file['sha256'], $hash)) {
                    $errors[] = "Checksum mismatch for {$relative}";
                }
                $size = filesize($backupFile);
                if ($size === false || (int) $file['size'] !== (int) $size) {
                    $errors[] = "Size mismatch for {$relative}";
                }
            } catch (\Throwable $e) {
                $errors[] = $e->getMessage();
            }
        }

        foreach ($manifest['directories'] ?? [] as $directory) {
            try {
                $relative = (string) $directory['path'];
                $backupDirectory = $this->payloadPath($filesDir, $relative, true);
                if (!is_dir($backupDirectory) || is_link($backupDirectory)) {
                    $errors[] = "Missing backup directory {$relative}";
                }
            } catch (\Throwable $e) {
                $errors[] = $e->getMessage();
            }
        }

        return ['valid' => $errors === [], 'backup_id' => $backupId, 'errors' => array_values(array_unique($errors))];
    }

    /** @return array<string,mixed> */
    public function manifest(string $backupId): array
    {
        return $this->loadManifest($backupId, true);
    }

    /** @return array{matches:bool,backup_id:string,errors:list<string>} */
    public function matchesCurrent(string $backupId): array
    {
        $verification = $this->verify($backupId);
        if (!($verification['valid'] ?? false)) {
            return ['matches'=>false,'backup_id'=>$backupId,'errors'=>(array)($verification['errors']??['Backup does not verify.'])];
        }
        try { $manifest=$this->loadManifest($backupId,true); } catch (\Throwable $e) { return ['matches'=>false,'backup_id'=>$backupId,'errors'=>[$e->getMessage()]]; }
        $errors=[];
        foreach ((array)($manifest['paths']??[]) as $entry) {
            if (!is_array($entry)) { $errors[]='Invalid backup path entry.'; continue; }
            $relative=(string)($entry['path']??'');
            try { $target=$this->guard->resolve($relative); } catch (\Throwable $e) { $errors[]=$e->getMessage(); continue; }
            $actualExists=file_exists($target)||is_link($target);
            $expectedExists=(bool)($entry['exists']??false);
            if ($expectedExists !== $actualExists) { $errors[]="State drift for {$relative}: existence changed."; continue; }
            if (!$expectedExists) continue;
            if (is_link($target)) { $errors[]="State drift for {$relative}: symbolic link detected."; continue; }
            $type=(string)($entry['type']??'');
            if ($type==='file') {
                if (!is_file($target)) { $errors[]="State drift for {$relative}: type changed."; continue; }
                try { $file=$this->fileEntry($manifest,$relative); } catch (\Throwable $e) { $errors[]=$e->getMessage(); continue; }
                $hash=hash_file('sha256',$target); $size=filesize($target);
                if (!is_string($hash) || !hash_equals((string)$file['sha256'],$hash) || $size===false || (int)$file['size']!==(int)$size) {
                    $errors[]="State drift for {$relative}: file bytes changed.";
                }
                continue;
            }
            if ($type!=='directory' || !is_dir($target)) { $errors[]="State drift for {$relative}: type changed."; continue; }
            $prefix=rtrim($relative,'/').'/';
            $expectedDirs=[]; $expectedFiles=[];
            foreach ((array)($manifest['directories']??[]) as $dir) {
                if (!is_array($dir)) continue; $path=(string)($dir['path']??'');
                if ($path===$relative || str_starts_with($path,$prefix)) $expectedDirs[$path]=true;
            }
            foreach ((array)($manifest['files']??[]) as $file) {
                if (!is_array($file)) continue; $path=(string)($file['path']??'');
                if ($path===$relative || str_starts_with($path,$prefix)) $expectedFiles[$path]=['sha256'=>(string)($file['sha256']??''),'size'=>(int)($file['size']??-1)];
            }
            $actualDirs=[$relative=>true]; $actualFiles=[];
            $it=new \RecursiveIteratorIterator(new \RecursiveDirectoryIterator($target,\FilesystemIterator::SKIP_DOTS),\RecursiveIteratorIterator::SELF_FIRST);
            foreach($it as $item){
                if($item->isLink()){ $errors[]="State drift for {$relative}: symbolic link appeared."; continue 2; }
                $path=$this->projectRelative($item->getPathname());
                if($item->isDir()){$actualDirs[$path]=true;continue;}
                $hash=hash_file('sha256',$item->getPathname());$size=filesize($item->getPathname());
                $actualFiles[$path]=['sha256'=>is_string($hash)?$hash:'','size'=>$size===false?-1:(int)$size];
            }
            ksort($expectedDirs);ksort($actualDirs);ksort($expectedFiles);ksort($actualFiles);
            if(array_keys($expectedDirs)!==array_keys($actualDirs)){ $errors[]="State drift for {$relative}: directory membership changed."; continue; }
            if(array_keys($expectedFiles)!==array_keys($actualFiles)){ $errors[]="State drift for {$relative}: file membership changed."; continue; }
            foreach($expectedFiles as $path=>$expected){$actual=$actualFiles[$path];if(!hash_equals($expected['sha256'],$actual['sha256'])||$expected['size']!==$actual['size']){$errors[]="State drift for {$path}: file bytes changed.";break;}}
        }
        return ['matches'=>$errors===[],'backup_id'=>$backupId,'errors'=>array_values(array_unique($errors))];
    }


    /** Restore a previously verified backup. Caller MUST create a pre-rollback backup first. */
    public function restore(string $backupId): array
    {
        $verification = $this->verify($backupId);
        if (!$verification['valid']) {
            throw new RuntimeException('Cannot restore an invalid backup: '.implode('; ', $verification['errors']));
        }
        $manifest = $this->loadManifest($backupId, true);
        $dir = $this->backupDirectory($backupId, true);
        $filesDir = $dir.DIRECTORY_SEPARATOR.'files';
        $this->assertPayloadRootSafe($filesDir);

        $restored = [];
        foreach ($manifest['paths'] as $entry) {
            $relative = (string) $entry['path'];
            $target = $this->guard->resolve($relative);
            if (!$entry['exists']) {
                $this->atomicRemoveTarget($relative, $target);
                $restored[] = $relative;
                continue;
            }

            if ($entry['type'] === 'file') {
                $fileEntry = $this->fileEntry($manifest, $relative);
                $this->atomicRestoreFile($relative, $target, $filesDir, $fileEntry, $entry['mode'] ?? null);
                $restored[] = $relative;
                continue;
            }

            $this->atomicRestoreDirectory($relative, $target, $filesDir, $manifest, $entry['mode'] ?? null);
            $restored[] = $relative;
        }

        return [
            'restored' => true,
            'backup_id' => $backupId,
            'paths' => $manifest['paths'],
            'restored_scopes' => $restored,
        ];
    }

    /** @return list<string> */
    private function normalizeScopes(array $paths): array
    {
        $normalized = [];
        foreach ($paths as $path) {
            $normalized[] = $this->guard->normalizeRelative((string) $path);
        }
        $normalized = array_values(array_unique($normalized));
        usort($normalized, static function (string $a, string $b): int {
            $depth = substr_count($a, '/') <=> substr_count($b, '/');
            if ($depth !== 0) {
                return $depth;
            }
            $natural = strnatcasecmp($a, $b);
            return $natural !== 0 ? $natural : strcmp($a, $b);
        });

        $collapsed = [];
        foreach ($normalized as $candidate) {
            $covered = false;
            foreach ($collapsed as $parent) {
                if ($candidate === $parent || str_starts_with($candidate, rtrim($parent, '/').'/')) {
                    $covered = true;
                    break;
                }
            }
            if (!$covered) {
                $collapsed[] = $candidate;
            }
        }
        return $collapsed;
    }

    private function copyFileIntoBackup(string $relative, string $source, string $filesDir, array &$manifest): void
    {
        if (is_link($source) || !is_file($source)) {
            throw new RuntimeException("Backup source '{$relative}' is not a regular file.");
        }

        $before = $this->fileSnapshot($source);
        $destination = $this->payloadPath($filesDir, $relative, false);
        $this->ensureParent($destination, 0700);
        $temp = $destination.'.titan-mcp-copy-'.bin2hex(random_bytes(6)).'.tmp';

        try {
            if (!copy($source, $temp)) {
                throw new RuntimeException("Unable to back up '{$relative}'.");
            }
            $after = $this->fileSnapshot($source);
            $copied = $this->fileSnapshot($temp);
            if (!hash_equals($before['sha256'], $after['sha256']) || $before['size'] !== $after['size']) {
                throw new RuntimeException("Backup source file '{$relative}' changed while it was being copied; inconsistent backup rejected.");
            }
            if (!hash_equals($before['sha256'], $copied['sha256']) || $before['size'] !== $copied['size']) {
                throw new RuntimeException("Backup copy verification failed for '{$relative}'.");
            }
            @chmod($temp, 0600);
            if (!rename($temp, $destination)) {
                throw new RuntimeException("Unable to finalize backup file '{$relative}'.");
            }
            @chmod($destination, 0600);
            $manifest['files'][] = [
                'path' => $relative,
                'sha256' => $copied['sha256'],
                'size' => $copied['size'],
                'mode' => $this->mode($source),
            ];
        } finally {
            if (file_exists($temp) || is_link($temp)) {
                @unlink($temp);
            }
        }
    }

    /** @return array<string,mixed> */
    private function loadManifest(string $backupId, bool $verifyChecksum): array
    {
        $dir = $this->backupDirectory($backupId, true);
        $manifestPath = $dir.DIRECTORY_SEPARATOR.'manifest.json';
        if (!is_file($manifestPath) || is_link($manifestPath)) {
            throw new RuntimeException("Backup '{$backupId}' does not contain a safe manifest.");
        }
        $raw = file_get_contents($manifestPath);
        if (!is_string($raw) || $raw === '') {
            throw new RuntimeException('Backup manifest is unreadable or empty.');
        }

        $decoded = json_decode($raw, true, flags: JSON_THROW_ON_ERROR);
        if (!is_array($decoded)) {
            throw new RuntimeException('Invalid backup manifest.');
        }

        $schema = (int) ($decoded['schema'] ?? 0);
        if ($verifyChecksum && $schema >= 3) {
            $checksumPath = $dir.DIRECTORY_SEPARATOR.'manifest.sha256';
            if (!is_file($checksumPath) || is_link($checksumPath)) {
                throw new RuntimeException('Pass-6 backup manifest checksum is missing or unsafe.');
            }
            $expected = strtolower(trim((string) file_get_contents($checksumPath)));
            if (!preg_match('/^[a-f0-9]{64}$/', $expected)) {
                throw new RuntimeException('Pass-6 backup manifest checksum is malformed.');
            }
            $actual = hash('sha256', $raw);
            if (!hash_equals($expected, $actual)) {
                throw new RuntimeException('Backup manifest checksum mismatch.');
            }
        }

        $this->validateManifestStructure($decoded);
        if (($decoded['backup_id'] ?? null) !== $backupId) {
            throw new RuntimeException('Backup manifest identifier does not match requested backup.');
        }
        return $decoded;
    }

    /** @param array<string,mixed> $manifest */
    private function validateManifestStructure(array $manifest): void
    {
        $schema = (int) ($manifest['schema'] ?? 0);
        if (!in_array($schema, [2, 3], true)) {
            throw new RuntimeException('Unsupported filesystem backup manifest schema.');
        }
        foreach (['paths', 'directories', 'files'] as $key) {
            if (!isset($manifest[$key]) || !is_array($manifest[$key])) {
                throw new RuntimeException("Backup manifest '{$key}' must be an array.");
            }
        }

        $scopes = [];
        foreach ($manifest['paths'] as $entry) {
            if (!is_array($entry) || !isset($entry['path'], $entry['exists'], $entry['type'])) {
                throw new RuntimeException('Backup manifest contains an invalid path scope.');
            }
            $path = $this->validateManifestRelativePath($entry['path']);
            if (isset($scopes[$path])) {
                throw new RuntimeException("Backup manifest contains duplicate scope '{$path}'.");
            }
            if (!is_bool($entry['exists'])) {
                throw new RuntimeException("Backup manifest existence flag is invalid for '{$path}'.");
            }
            $type = (string) $entry['type'];
            if (!in_array($type, ['file', 'directory', 'missing'], true)) {
                throw new RuntimeException("Backup manifest type is invalid for '{$path}'.");
            }
            if (($entry['exists'] && $type === 'missing') || (!$entry['exists'] && $type !== 'missing')) {
                throw new RuntimeException("Backup manifest existence/type mismatch for '{$path}'.");
            }
            $this->validateMode($entry['mode'] ?? null, $path);
            $scopes[$path] = ['exists' => $entry['exists'], 'type' => $type];
        }
        if ($scopes === []) {
            throw new RuntimeException('Backup manifest contains no restorable scopes.');
        }

        $seenDirs = [];
        foreach ($manifest['directories'] as $entry) {
            if (!is_array($entry) || !isset($entry['path'])) {
                throw new RuntimeException('Backup manifest contains an invalid directory entry.');
            }
            $path = $this->validateManifestRelativePath($entry['path']);
            if (isset($seenDirs[$path])) {
                throw new RuntimeException("Backup manifest contains duplicate directory '{$path}'.");
            }
            $this->validateMode($entry['mode'] ?? null, $path);
            if (!$this->coveredByExistingScope($path, $scopes)) {
                throw new RuntimeException("Backup directory '{$path}' is outside declared backup scopes.");
            }
            $seenDirs[$path] = true;
        }

        $seenFiles = [];
        foreach ($manifest['files'] as $entry) {
            if (!is_array($entry) || !isset($entry['path'], $entry['sha256'], $entry['size'])) {
                throw new RuntimeException('Backup manifest contains an invalid file entry.');
            }
            $path = $this->validateManifestRelativePath($entry['path']);
            if (isset($seenFiles[$path])) {
                throw new RuntimeException("Backup manifest contains duplicate file '{$path}'.");
            }
            $sha = strtolower((string) $entry['sha256']);
            if (!preg_match('/^[a-f0-9]{64}$/', $sha)) {
                throw new RuntimeException("Backup manifest checksum is invalid for '{$path}'.");
            }
            if (!is_int($entry['size']) || $entry['size'] < 0) {
                throw new RuntimeException("Backup manifest size is invalid for '{$path}'.");
            }
            $this->validateMode($entry['mode'] ?? null, $path);
            if (!$this->coveredByExistingScope($path, $scopes)) {
                throw new RuntimeException("Backup file '{$path}' is outside declared backup scopes.");
            }
            $seenFiles[$path] = true;
        }

        foreach ($scopes as $path => $scope) {
            if (!$scope['exists']) {
                foreach (array_keys($seenFiles + $seenDirs) as $child) {
                    if ($child === $path || str_starts_with($child, $path.'/')) {
                        throw new RuntimeException("Missing backup scope '{$path}' cannot contain payload entries.");
                    }
                }
                continue;
            }
            if ($scope['type'] === 'file' && !isset($seenFiles[$path])) {
                throw new RuntimeException("File backup scope '{$path}' is missing its payload entry.");
            }
            if ($scope['type'] === 'directory' && !isset($seenDirs[$path])) {
                throw new RuntimeException("Directory backup scope '{$path}' is missing its root directory entry.");
            }
        }
    }

    /** @param array<string,array{exists:bool,type:string}> $scopes */
    private function coveredByExistingScope(string $candidate, array $scopes): bool
    {
        foreach ($scopes as $scope => $state) {
            if (!$state['exists']) {
                continue;
            }
            if ($candidate === $scope) {
                return true;
            }
            if ($state['type'] === 'directory' && str_starts_with($candidate, rtrim($scope, '/').'/')) {
                return true;
            }
        }
        return false;
    }

    private function validateManifestRelativePath(mixed $value): string
    {
        if (!is_string($value) || $value === '') {
            throw new RuntimeException('Backup manifest contains an empty or non-string path.');
        }
        try {
            $normalized = $this->guard->normalizeRelative($value);
        } catch (\Throwable $e) {
            throw new RuntimeException("Unsafe path '{$value}' in backup manifest.", 0, $e);
        }
        if ($normalized !== str_replace('\\', '/', $value)) {
            throw new RuntimeException("Non-canonical path '{$value}' in backup manifest.");
        }
        return $normalized;
    }

    private function validateMode(mixed $mode, string $path): void
    {
        if ($mode !== null && (!is_int($mode) || $mode < 0 || $mode > 0777)) {
            throw new RuntimeException("Backup manifest mode is invalid for '{$path}'.");
        }
    }

    /** @return array{path:string,sha256:string,size:int,mode:mixed} */
    private function fileEntry(array $manifest, string $relative): array
    {
        foreach ($manifest['files'] as $file) {
            if (($file['path'] ?? null) === $relative) {
                return $file;
            }
        }
        throw new RuntimeException("Backup payload is missing file entry '{$relative}'.");
    }

    private function atomicRestoreFile(string $relative, string $target, string $filesDir, array $fileEntry, mixed $mode): void
    {
        $source = $this->payloadPath($filesDir, $relative, true);
        $this->ensureParent($target, 0755);
        $stage = $this->stageSibling($target, 'file');
        try {
            if (!copy($source, $stage)) {
                throw new RuntimeException("Unable to stage restore for '{$relative}'.");
            }
            $snapshot = $this->fileSnapshot($stage);
            if (!hash_equals((string) $fileEntry['sha256'], $snapshot['sha256']) || (int) $fileEntry['size'] !== $snapshot['size']) {
                throw new RuntimeException("Staged restore verification failed for '{$relative}'.");
            }
            $this->applyMode($stage, $mode);
            $this->atomicSwapIntoTarget($relative, $stage, $target);
        } finally {
            if (file_exists($stage) || is_link($stage)) {
                $this->removeRecursively($stage);
            }
        }
    }

    private function atomicRestoreDirectory(string $relative, string $target, string $filesDir, array $manifest, mixed $mode): void
    {
        $this->ensureParent($target, 0755);
        $stage = $this->stageSibling($target, 'dir');
        if (!mkdir($stage, 0700)) {
            throw new RuntimeException("Unable to create restore staging directory for '{$relative}'.");
        }

        try {
            $prefix = rtrim($relative, '/').'/';
            $directoryModes = [];
            foreach ($manifest['directories'] as $directory) {
                $dirPath = (string) $directory['path'];
                if ($dirPath === $relative) {
                    continue;
                }
                if (!str_starts_with($dirPath, $prefix)) {
                    continue;
                }
                $suffix = substr($dirPath, strlen($prefix));
                $destination = $stage.DIRECTORY_SEPARATOR.str_replace('/', DIRECTORY_SEPARATOR, $suffix);
                if (!is_dir($destination) && !mkdir($destination, 0700, true) && !is_dir($destination)) {
                    throw new RuntimeException("Unable to stage restore directory '{$dirPath}'.");
                }
                $directoryModes[] = ['path' => $destination, 'mode' => $directory['mode'] ?? null];
            }

            foreach ($manifest['files'] as $file) {
                $filePath = (string) $file['path'];
                if (!str_starts_with($filePath, $prefix)) {
                    continue;
                }
                $suffix = substr($filePath, strlen($prefix));
                $source = $this->payloadPath($filesDir, $filePath, true);
                $destination = $stage.DIRECTORY_SEPARATOR.str_replace('/', DIRECTORY_SEPARATOR, $suffix);
                $this->ensureParent($destination, 0700);
                if (!copy($source, $destination)) {
                    throw new RuntimeException("Unable to stage restore file '{$filePath}'.");
                }
                $snapshot = $this->fileSnapshot($destination);
                if (!hash_equals((string) $file['sha256'], $snapshot['sha256']) || (int) $file['size'] !== $snapshot['size']) {
                    throw new RuntimeException("Staged restore verification failed for '{$filePath}'.");
                }
                $this->applyMode($destination, $file['mode'] ?? null);
            }

            usort($directoryModes, static fn (array $a, array $b): int => strlen((string) $b['path']) <=> strlen((string) $a['path']));
            foreach ($directoryModes as $directory) {
                $this->applyMode((string) $directory['path'], $directory['mode']);
            }
            $this->applyMode($stage, $mode);
            $this->atomicSwapIntoTarget($relative, $stage, $target);
        } finally {
            if (file_exists($stage) || is_link($stage)) {
                $this->removeRecursively($stage);
            }
        }
    }

    private function atomicSwapIntoTarget(string $relative, string $stage, string $target): void
    {
        $safeTarget = $this->guard->resolve($relative);
        if ($safeTarget !== $target) {
            throw new RuntimeException("Restore target changed while staging '{$relative}'.");
        }

        $old = null;
        if (file_exists($target) || is_link($target)) {
            if (is_link($target)) {
                throw new RuntimeException("Refusing to replace symbolic link '{$relative}' during restore.");
            }
            $old = $this->stageSibling($target, 'old');
            if (!rename($target, $old)) {
                throw new RuntimeException("Unable to move current target aside for '{$relative}'.");
            }
        }

        try {
            if (!rename($stage, $target)) {
                throw new RuntimeException("Unable to atomically activate restored target '{$relative}'.");
            }
        } catch (\Throwable $e) {
            if ($old !== null && !file_exists($target) && !is_link($target)) {
                @rename($old, $target);
            }
            throw $e;
        }

        if ($old !== null) {
            $this->removeRecursively($old);
        }
    }

    private function atomicRemoveTarget(string $relative, string $target): void
    {
        if (!file_exists($target) && !is_link($target)) {
            return;
        }
        $safeTarget = $this->guard->resolve($relative);
        if ($safeTarget !== $target || is_link($target)) {
            throw new RuntimeException("Unsafe target '{$relative}' during missing-target restore.");
        }
        $tombstone = $this->stageSibling($target, 'remove');
        if (!rename($target, $tombstone)) {
            throw new RuntimeException("Unable to atomically remove '{$relative}' during restore.");
        }
        try {
            $this->removeRecursively($tombstone);
        } catch (\Throwable $e) {
            if (!file_exists($target) && !is_link($target)) {
                @rename($tombstone, $target);
            }
            throw $e;
        }
    }

    private function stageSibling(string $target, string $kind): string
    {
        return dirname($target).DIRECTORY_SEPARATOR.'.'.basename($target).'.titan-mcp-'.$kind.'-'.bin2hex(random_bytes(6));
    }

    /** @return array{sha256:string,size:int} */
    private function fileSnapshot(string $path): array
    {
        if (!is_file($path) || is_link($path)) {
            throw new RuntimeException("File snapshot source '{$path}' is not a regular file.");
        }
        $hash = hash_file('sha256', $path);
        $size = filesize($path);
        if (!is_string($hash) || $size === false) {
            throw new RuntimeException("Unable to snapshot file '{$path}'.");
        }
        return ['sha256' => $hash, 'size' => (int) $size];
    }

    private function directoryFingerprint(string $absolute): string
    {
        if (!is_dir($absolute) || is_link($absolute)) {
            throw new RuntimeException("Directory snapshot source '{$absolute}' is unsafe.");
        }
        $entries = [];
        $iterator = new \RecursiveIteratorIterator(
            new \RecursiveDirectoryIterator($absolute, \FilesystemIterator::SKIP_DOTS),
            \RecursiveIteratorIterator::SELF_FIRST
        );
        foreach ($iterator as $item) {
            if ($item->isLink()) {
                throw new RuntimeException("Refusing symbolic link while fingerprinting '{$absolute}'.");
            }
            $relative = $this->projectRelative($item->getPathname());
            $entries[$relative] = [
                'type' => $item->isDir() ? 'directory' : 'file',
                'size' => $item->isFile() ? $item->getSize() : null,
                'mtime' => $item->getMTime(),
                'mode' => $this->mode($item->getPathname()),
            ];
        }
        ksort($entries, SORT_STRING);
        return hash('sha256', json_encode($entries, JSON_UNESCAPED_SLASHES | JSON_THROW_ON_ERROR));
    }

    private function projectRelative(string $absolute): string
    {
        $normalized = str_replace('\\', '/', $absolute);
        $root = rtrim(str_replace('\\', '/', $this->canonicalProjectRoot), '/');
        if (!str_starts_with($normalized, $root.'/')) {
            throw new RuntimeException("Backup source '{$absolute}' escaped the project root.");
        }
        return ltrim(substr($normalized, strlen($root)), '/');
    }

    private function payloadPath(string $filesDir, string $relative, bool $mustExist): string
    {
        $this->validateManifestRelativePath($relative);
        $base = realpath($filesDir);
        if ($base === false || !is_dir($base) || is_link($filesDir)) {
            throw new RuntimeException('Filesystem backup payload root is missing or unsafe.');
        }
        $base = rtrim($base, DIRECTORY_SEPARATOR);
        $current = $base;
        foreach (explode('/', $relative) as $segment) {
            $current .= DIRECTORY_SEPARATOR.$segment;
            if (is_link($current)) {
                throw new RuntimeException("Symbolic link found inside filesystem backup payload '{$relative}'.");
            }
            if (file_exists($current)) {
                $real = realpath($current);
                if ($real === false || !$this->isWithin($real, $base)) {
                    throw new RuntimeException("Filesystem backup payload path escapes backup root '{$relative}'.");
                }
            }
        }
        if ($mustExist && !file_exists($current)) {
            throw new RuntimeException("Filesystem backup payload '{$relative}' is missing.");
        }
        return $current;
    }

    private function assertPayloadRootSafe(string $filesDir): void
    {
        if (!is_dir($filesDir) || is_link($filesDir)) {
            throw new RuntimeException('Filesystem backup payload root is missing or unsafe.');
        }
        $real = realpath($filesDir);
        $root = realpath($this->normalizedBackupRoot);
        if ($real === false || $root === false || !$this->isWithin($real, $root)) {
            throw new RuntimeException('Filesystem backup payload root escapes configured backup storage.');
        }
    }

    private function backupDirectory(string $backupId, bool $mustExist): string
    {
        if (!preg_match('/^[A-Za-z0-9_-]+$/', $backupId)) {
            throw new RuntimeException('Invalid backup identifier.');
        }
        $this->assertBackupRootPathSafe(false);
        $path = $this->normalizedBackupRoot.DIRECTORY_SEPARATOR.$backupId;
        if (is_link($path)) {
            throw new RuntimeException("Backup '{$backupId}' is a symbolic link and is unsafe.");
        }
        if ($mustExist && !is_dir($path)) {
            throw new RuntimeException("Backup '{$backupId}' does not exist.");
        }
        if (is_dir($path)) {
            $real = realpath($path);
            $root = realpath($this->normalizedBackupRoot);
            if ($real === false || $root === false || !$this->isWithin($real, $root)) {
                throw new RuntimeException("Backup '{$backupId}' escapes configured backup storage.");
            }
        }
        return $path;
    }

    private function assertBackupRootPathSafe(bool $create): void
    {
        if (!$this->isWithinProject($this->normalizedBackupRoot) || $this->normalizedBackupRoot === $this->canonicalProjectRoot) {
            throw new RuntimeException('Filesystem backup root must remain inside the Titan Zero project root.');
        }

        $relative = ltrim(substr(
            str_replace('\\', '/', $this->normalizedBackupRoot),
            strlen(rtrim(str_replace('\\', '/', $this->canonicalProjectRoot), '/'))
        ), '/');
        $current = $this->canonicalProjectRoot;
        foreach (array_filter(explode('/', $relative), static fn (string $segment): bool => $segment !== '') as $segment) {
            $current .= DIRECTORY_SEPARATOR.$segment;
            if (is_link($current)) {
                throw new RuntimeException('Filesystem backup root contains a symbolic link component.');
            }
            if (file_exists($current) && !is_dir($current)) {
                throw new RuntimeException('Filesystem backup root contains a non-directory component.');
            }
        }

        if ($create && !is_dir($this->normalizedBackupRoot)) {
            if (!mkdir($this->normalizedBackupRoot, 0700, true) && !is_dir($this->normalizedBackupRoot)) {
                throw new RuntimeException('Unable to create filesystem backup root.');
            }
        }
        if (is_dir($this->normalizedBackupRoot)) {
            @chmod($this->normalizedBackupRoot, 0700);
            $real = realpath($this->normalizedBackupRoot);
            if ($real === false || !$this->isWithinProject($real) || is_link($this->normalizedBackupRoot)) {
                throw new RuntimeException('Filesystem backup root failed canonical safety verification.');
            }
        } elseif (!$create) {
            // Reading a backup from an absent root will fail at the requested backup directory.
            return;
        }
    }

    private function normalizeAbsolutePath(string $path): string
    {
        if ($path === '' || str_contains($path, "\0")) {
            throw new RuntimeException('Filesystem backup root must be a non-empty absolute path.');
        }
        $path = str_replace('\\', '/', $path);
        $prefix = '';
        if (preg_match('/^[A-Za-z]:\//', $path) === 1) {
            $prefix = strtoupper(substr($path, 0, 2));
            $path = substr($path, 2);
        } elseif (str_starts_with($path, '/')) {
            $prefix = '/';
        } else {
            throw new RuntimeException('Filesystem backup root must be absolute.');
        }

        $stack = [];
        foreach (explode('/', $path) as $segment) {
            if ($segment === '' || $segment === '.') {
                continue;
            }
            if ($segment === '..') {
                if ($stack === []) {
                    throw new RuntimeException('Filesystem backup root escapes its filesystem prefix.');
                }
                array_pop($stack);
                continue;
            }
            $stack[] = $segment;
        }
        $normalized = ($prefix === '/' ? '/' : $prefix.'/').implode('/', $stack);
        return rtrim(str_replace('/', DIRECTORY_SEPARATOR, $normalized), DIRECTORY_SEPARATOR);
    }

    private function isWithinProject(string $path): bool
    {
        return $this->isWithin($path, $this->canonicalProjectRoot);
    }

    private function isWithin(string $path, string $root): bool
    {
        $path = rtrim(str_replace('\\', '/', $path), '/');
        $root = rtrim(str_replace('\\', '/', $root), '/');
        return $path === $root || str_starts_with($path.'/', $root.'/');
    }

    private function writeAtomicInternal(string $path, string $contents, int $mode): void
    {
        $this->ensureParent($path, 0700);
        $temp = $path.'.tmp.'.bin2hex(random_bytes(6));
        $handle = @fopen($temp, 'xb');
        if ($handle === false) {
            throw new RuntimeException("Unable to create temporary backup metadata '{$temp}'.");
        }
        try {
            if (!flock($handle, LOCK_EX)) {
                throw new RuntimeException('Unable to lock temporary backup metadata file.');
            }
            $length = strlen($contents);
            $written = 0;
            while ($written < $length) {
                $chunk = fwrite($handle, substr($contents, $written));
                if ($chunk === false || $chunk === 0) {
                    throw new RuntimeException('Unable to write complete backup metadata.');
                }
                $written += $chunk;
            }
            if (!fflush($handle)) {
                throw new RuntimeException('Unable to flush backup metadata.');
            }
            if (function_exists('fsync') && !@fsync($handle)) {
                throw new RuntimeException('Unable to synchronize backup metadata to storage.');
            }
            @chmod($temp, $mode & 0777);
        } finally {
            fclose($handle);
        }
        if (!rename($temp, $path)) {
            @unlink($temp);
            throw new RuntimeException("Unable to atomically finalize backup metadata '{$path}'.");
        }
        @chmod($path, $mode & 0777);
    }

    /** @param list<array<string,mixed>> $entries @return list<array<string,mixed>> */
    private function uniquePathEntries(array $entries): array
    {
        $byPath = [];
        foreach ($entries as $entry) {
            $byPath[(string) $entry['path']] = $entry;
        }
        uksort($byPath, static function (string $a, string $b): int {
            $natural = strnatcasecmp($a, $b);
            return $natural !== 0 ? $natural : strcmp($a, $b);
        });
        return array_values($byPath);
    }

    /** @param list<array<string,mixed>> $entries @return list<array<string,mixed>> */
    private function sortPathEntries(array $entries): array
    {
        usort($entries, static function (array $a, array $b): int {
            $left = (string) ($a['path'] ?? '');
            $right = (string) ($b['path'] ?? '');
            $depth = substr_count($left, '/') <=> substr_count($right, '/');
            if ($depth !== 0) {
                return $depth;
            }
            $natural = strnatcasecmp($left, $right);
            return $natural !== 0 ? $natural : strcmp($left, $right);
        });
        return $entries;
    }

    private function mode(string $path): ?int
    {
        $perms = @fileperms($path);
        return $perms === false ? null : ($perms & 0777);
    }

    private function applyMode(string $path, mixed $mode): void
    {
        if (is_int($mode)) {
            @chmod($path, $mode & 0777);
        }
    }

    private function ensureParent(string $path, int $mode = 0755): void
    {
        $parent = dirname($path);
        if (!is_dir($parent) && !mkdir($parent, $mode, true) && !is_dir($parent)) {
            throw new RuntimeException("Unable to create directory '{$parent}'.");
        }
    }

    private function removeRecursively(string $path): void
    {
        if (!file_exists($path) && !is_link($path)) {
            return;
        }
        if (is_link($path) || is_file($path)) {
            if (!@unlink($path)) {
                throw new RuntimeException("Unable to remove '{$path}'.");
            }
            return;
        }
        $items = new \RecursiveIteratorIterator(
            new \RecursiveDirectoryIterator($path, \FilesystemIterator::SKIP_DOTS),
            \RecursiveIteratorIterator::CHILD_FIRST
        );
        foreach ($items as $item) {
            if ($item->isDir() && !$item->isLink()) {
                if (!@rmdir($item->getPathname())) {
                    throw new RuntimeException("Unable to remove directory '{$item->getPathname()}'.");
                }
            } else {
                if (!@unlink($item->getPathname())) {
                    throw new RuntimeException("Unable to remove '{$item->getPathname()}'.");
                }
            }
        }
        if (!@rmdir($path)) {
            throw new RuntimeException("Unable to remove directory '{$path}'.");
        }
    }
}
