<?php
declare(strict_types=1);

function integration_expect(bool $condition, string $message): void
{
    if (!$condition) {
        fwrite(STDERR, "Archive CGI integration failed: {$message}\n");
        exit(1);
    }
}

function integration_rejection_kind(string $html): string
{
    foreach ([
        'Request rejected: malformed or ambiguous form data.' => 'malformed-or-ambiguous',
        'Request rejected: invalid CSRF token.' => 'invalid-csrf',
        'Request rejected: this DirectAdmin role is read-only in Developer Portal.' => 'read-only-role',
    ] as $message => $kind) {
        if (strpos($html, $message) !== false) {
            return $kind;
        }
    }
    return 'no-known-rejection-message';
}

function integration_remove_tree(string $path): void
{
    if (is_link($path) || is_file($path)) {
        @unlink($path);
        return;
    }
    if (!is_dir($path)) {
        return;
    }
    foreach (new DirectoryIterator($path) as $entry) {
        if ($entry->isDot()) {
            continue;
        }
        integration_remove_tree($entry->getPathname());
    }
    @rmdir($path);
}

function integration_run_role(string $entrypoint, string $pluginRoot, array $environment, ?string $body = null): array
{
    integration_expect(is_file($entrypoint) && is_executable($entrypoint), 'archived admin CGI entrypoint must be executable');
    $descriptors = [0 => ['pipe', 'r'], 1 => ['pipe', 'w'], 2 => ['pipe', 'w']];
    $process = @proc_open([PHP_BINARY, $entrypoint], $descriptors, $pipes, $pluginRoot, $environment, ['bypass_shell' => true]);
    integration_expect(is_resource($process), 'PHP CLI must start the extracted admin CGI entrypoint');
    if ($body !== null) {
        $offset = 0;
        $length = strlen($body);
        while ($offset < $length) {
            $written = fwrite($pipes[0], substr($body, $offset));
            integration_expect($written !== false && $written > 0, 'synthetic form body must reach role stdin');
            $offset += $written;
        }
    }
    fclose($pipes[0]);
    $stdout = (string)stream_get_contents($pipes[1]);
    $stderr = (string)stream_get_contents($pipes[2]);
    fclose($pipes[1]);
    fclose($pipes[2]);
    $status = proc_close($process);
    integration_expect($status === 0, 'archived role entrypoint must exit successfully');
    integration_expect($stderr === '', 'archived role entrypoint must not emit PHP errors');
    return [$stdout, $stderr];
}

integration_expect(count($argv) >= 2, 'pass the root directory of the extracted Developer Portal archive');
$pluginRoot = realpath($argv[1]);
integration_expect($pluginRoot !== false, 'extracted archive root must resolve');
$manifest = @file_get_contents($pluginRoot . '/plugin.conf');
integration_expect(is_string($manifest), 'extracted archive must contain plugin.conf at its root');
$fields = [];
foreach (preg_split('/\r?\n/', $manifest, -1, PREG_SPLIT_NO_EMPTY) as $line) {
    $index = strpos($line, '=');
    integration_expect($index !== false && $index > 0, 'plugin.conf lines must be key/value pairs');
    $fields[substr($line, 0, $index)] = substr($line, $index + 1);
}
integration_expect(($fields['name'] ?? '') === 'Developer Portal', 'modern candidate display name must be Developer Portal');
integration_expect(preg_match('/^\d+\.\d+\.\d+(?:[-+][0-9A-Za-z.-]+)?$/', $fields['version'] ?? '') === 1 && version_compare($fields['version'], '1.3.3', '>='), 'candidate must include the DirectAdmin POST bridge version');
integration_expect(function_exists('posix_geteuid') && function_exists('posix_getpwuid') && function_exists('posix_getpwnam'), 'POSIX account functions are required for DirectAdmin CLI verification');
$account = posix_getpwuid(posix_geteuid());
integration_expect(is_array($account) && isset($account['name'], $account['dir']), 'effective UNIX account must resolve');
$accountHome = realpath($account['dir']);
integration_expect($accountHome !== false && is_dir($accountHome), 'effective UNIX account HOME must resolve');
integration_expect((int)posix_geteuid() > 0, 'integration must run as a non-root account');

$fixture = $accountHome . '/.titan-da-archive-cgi-' . bin2hex(random_bytes(6));
$home = $fixture . '/operator-home';
integration_expect(@mkdir($home, 0700, true), 'disposable account HOME fixture must be created');
register_shutdown_function(static function () use ($fixture): void {
    integration_remove_tree($fixture);
});
$secretDirectory = $home . '/.titan-dev-access';
integration_expect(@mkdir($secretDirectory, 0700, true), 'disposable CSRF directory must be created');
$secret = str_repeat('fixture-only-secret-', 4);
$secretFile = $secretDirectory . '/csrf.key';
integration_expect(file_put_contents($secretFile, $secret, LOCK_EX) !== false, 'disposable CSRF fixture must be written');
chmod($secretDirectory, 0700);
chmod($secretFile, 0600);
$token = hash_hmac('sha256', 'titan_dev_access_form_v2', $secret);

$username = (string)$account['name'];
$baseEnvironment = [
    'PATH' => getenv('PATH') ?: '/usr/local/bin:/usr/bin:/bin',
    'USERNAME' => $username,
    'USER' => $username,
    'HOME' => $home,
    'CONTENT_TYPE' => 'application/x-www-form-urlencoded',
];
foreach (['LD_LIBRARY_PATH', 'PHP_INI_SCAN_DIR', 'TMPDIR'] as $name) {
    $value = getenv($name);
    if ($value !== false) {
        $baseEnvironment[$name] = $value;
    }
}
$route = '/CMD_PLUGINS_ADMIN/titan_dev_access';
$entrypoint = $pluginRoot . '/admin/index.html';
$getEnvironment = array_replace($baseEnvironment, [
    'REQUEST_METHOD' => 'GET',
    'SCRIPT_NAME' => $route,
    'QUERY_STRING' => '',
]);
[$html] = integration_run_role($entrypoint, $pluginRoot, $getEnvironment);
integration_expect(substr_count($html, 'action="?pipe_post=yes"') === 2, 'packaged admin run and key forms must use DirectAdmin stdin transport');
integration_expect(preg_match('/<input type="hidden" name="csrf" value="([a-f0-9]{64})">/', $html, $matches) === 1, 'packaged admin form must render the canonical CSRF input');
integration_expect(strpos($html, 'name="public_key"') !== false && strpos($html, 'name="add_key"') !== false, 'packaged admin page must render its public-key submission form');

// Public test-vector material only; no private key is generated or stored.
$syntheticKey = 'ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAINdamAGCsQq31Uv+08lkBzoO4XLz2qYjJa8CGmj3B1Ea portfolio-fixture+plus/slash';
$textareaValue = $syntheticKey . "\r\n";
$body = http_build_query([
    'csrf' => $matches[1],
    'public_key' => $textareaValue,
    'add_key' => '1',
], '', '&', PHP_QUERY_RFC1738);
integration_expect(strpos($body, '%2B') !== false && strpos($body, '%2F') !== false, 'browser form encoding must escape plus and slash characters in the synthetic key');
$postEnvironment = array_replace($baseEnvironment, [
    'REQUEST_METHOD' => 'POST',
    'SCRIPT_NAME' => $route,
    'QUERY_STRING' => 'pipe_post=yes',
    'POST' => 'stdin=true',
    'CONTENT_LENGTH' => (string)strlen($body),
    'csrf' => $matches[1],
    'public_key' => $textareaValue,
    'add_key' => '1',
]);
[$result] = integration_run_role($entrypoint, $pluginRoot, $postEnvironment, $body);
integration_expect(strpos($result, 'Request rejected: malformed or ambiguous form data.') === false, 'valid synthetic key form must not be rejected as malformed or ambiguous');
integration_expect(strpos($result, 'Request rejected: invalid CSRF token.') === false, 'valid synthetic key form must not be rejected for CSRF');
integration_expect(strpos($result, 'Public key installed.') !== false, 'actual extracted admin entrypoint must accept the synthetic public key');

$sshDirectory = $home . '/.ssh';
$authorizedKeys = $sshDirectory . '/authorized_keys';
integration_expect(is_dir($sshDirectory) && is_file($authorizedKeys), 'synthetic key submit must create SSH fixture state only in disposable HOME');
integration_expect((file_get_contents($authorizedKeys) ?: '') === $syntheticKey . "\n", 'authorized_keys fixture must contain exactly the submitted synthetic public key');
integration_expect(((fileperms($sshDirectory) ?: 0) & 0777) === 0700, 'disposable .ssh directory must be mode 0700');
integration_expect(((fileperms($authorizedKeys) ?: 0) & 0777) === 0600, 'disposable authorized_keys fixture must be mode 0600');

// Also exercise DirectAdmin's raw POST environment transport with the same browser body.
$rawPostEnvironment = array_replace($postEnvironment, ['POST' => $body]);
unset($rawPostEnvironment['csrf'], $rawPostEnvironment['public_key'], $rawPostEnvironment['add_key']);
[$duplicate] = integration_run_role($entrypoint, $pluginRoot, $rawPostEnvironment);
integration_expect(strpos($duplicate, 'Key already installed.') !== false, 'duplicate synthetic key submit must be idempotently rejected');
integration_expect((file_get_contents($authorizedKeys) ?: '') === $syntheticKey . "\n", 'duplicate submit must not duplicate the synthetic key');

$trailingByteBody = $body . "\n";
$trailingByteEnvironment = array_replace($baseEnvironment, [
    'REQUEST_METHOD' => 'POST',
    'SCRIPT_NAME' => $route,
    'QUERY_STRING' => 'pipe_post=yes',
    'POST' => 'stdin=true',
    'CONTENT_LENGTH' => (string)strlen($trailingByteBody),
]);
[$rejected] = integration_run_role($entrypoint, $pluginRoot, $trailingByteEnvironment, $trailingByteBody);
integration_expect(strpos($rejected, 'Request rejected: malformed or ambiguous form data.') !== false, 'a trailing byte after the serialized form must fail closed with the reported diagnostic (observed=' . integration_rejection_kind($rejected) . ')');
integration_expect((file_get_contents($authorizedKeys) ?: '') === $syntheticKey . "\n", 'rejected trailing-byte form must not change authorized_keys');

echo "Synthetic public-key form submission passed against the extracted archive; no real key or account data was used.\n";
