<?php
declare(strict_types=1);

function integration_expect(bool $condition, string $message): void
{
    if (!$condition) {
        fwrite(STDERR, "Archive CGI integration failed: {$message}\n");
        exit(1);
    }
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
$stdinBody = $body;
$postEnvironment = array_replace($baseEnvironment, [
    'REQUEST_METHOD' => 'POST',
    'SCRIPT_NAME' => $route,
    'QUERY_STRING' => 'pipe_post=yes',
    'POST' => 'stdin=true',
    'CONTENT_LENGTH' => (string)strlen($stdinBody),
    'csrf' => $matches[1],
    'public_key' => $textareaValue,
    'add_key' => '1',
]);
[$result] = integration_run_role($entrypoint, $pluginRoot, $postEnvironment, $stdinBody);
integration_expect(strpos($result, 'Request rejected: malformed or ambiguous form data.') === false, 'valid synthetic key form must not be rejected as malformed or ambiguous');
integration_expect(strpos($result, 'Request rejected: invalid CSRF token.') === false, 'valid synthetic key form must not be rejected for CSRF');
integration_expect(strpos($result, 'Public key installed.') !== false, 'actual extracted admin entrypoint must accept the synthetic public key');

$sshDirectory = $home . '/.ssh';
$authorizedKeys = $sshDirectory . '/authorized_keys';
integration_expect(is_dir($sshDirectory) && is_file($authorizedKeys), 'synthetic key submit must create SSH fixture state only in disposable HOME');
integration_expect((file_get_contents($authorizedKeys) ?: '') === $syntheticKey . "\n", 'authorized_keys fixture must contain exactly the submitted synthetic public key');
integration_expect(((fileperms($sshDirectory) ?: 0) & 0777) === 0700, 'disposable .ssh directory must be mode 0700');
integration_expect(((fileperms($authorizedKeys) ?: 0) & 0777) === 0600, 'disposable authorized_keys fixture must be mode 0600');

[$duplicate] = integration_run_role($entrypoint, $pluginRoot, $postEnvironment, $stdinBody);
integration_expect(strpos($duplicate, 'Key already installed.') !== false, 'duplicate stdin synthetic key submit must be idempotently rejected');
integration_expect((file_get_contents($authorizedKeys) ?: '') === $syntheticKey . "\n", 'duplicate stdin submit must not duplicate the synthetic key');

// The raw POST transport receives the serialized browser form in POST and may add one terminal LF.
$rawHome = $fixture . '/raw-operator-home';
integration_expect(@mkdir($rawHome, 0700, true), 'second disposable HOME must be created for raw POST transport');
$rawSecretDirectory = $rawHome . '/.titan-dev-access';
integration_expect(@mkdir($rawSecretDirectory, 0700, true), 'raw POST HOME CSRF directory must be created');
$rawSecretFile = $rawSecretDirectory . '/csrf.key';
integration_expect(file_put_contents($rawSecretFile, $secret, LOCK_EX) !== false, 'raw POST CSRF fixture must be written');
chmod($rawSecretDirectory, 0700);
chmod($rawSecretFile, 0600);
$rawGetEnvironment = array_replace($baseEnvironment, [
    'HOME' => $rawHome,
    'REQUEST_METHOD' => 'GET',
    'SCRIPT_NAME' => $route,
    'QUERY_STRING' => '',
]);
[$rawHtml] = integration_run_role($entrypoint, $pluginRoot, $rawGetEnvironment);
integration_expect(preg_match('/<input type="hidden" name="csrf" value="([a-f0-9]{64})">/', $rawHtml, $rawMatches) === 1, 'raw POST fixture must receive its own CSRF token');
$rawFormBody = http_build_query([
    'csrf' => $rawMatches[1],
    'public_key' => $textareaValue,
    'add_key' => '1',
], '', '&', PHP_QUERY_RFC1738) . "\n";
$rawPostEnvironment = array_replace($baseEnvironment, [
    'HOME' => $rawHome,
    'REQUEST_METHOD' => 'POST',
    'SCRIPT_NAME' => $route,
    'QUERY_STRING' => '',
    'POST' => $rawFormBody,
    'CONTENT_LENGTH' => (string)strlen($rawFormBody),
]);
[$rawResult] = integration_run_role($entrypoint, $pluginRoot, $rawPostEnvironment);
integration_expect(strpos($rawResult, 'Request rejected: malformed or ambiguous form data.') === false, 'raw POST with a terminal LF must not be rejected as malformed or ambiguous');
integration_expect(strpos($rawResult, 'Public key installed.') !== false, 'raw POST terminal-LF form must install the synthetic key');
$rawAuthorizedKeys = $rawHome . '/.ssh/authorized_keys';
integration_expect((file_get_contents($rawAuthorizedKeys) ?: '') === $syntheticKey . "\n", 'raw POST must preserve the exact synthetic key after trimming textarea CRLF');
[$rawDuplicate] = integration_run_role($entrypoint, $pluginRoot, $rawPostEnvironment);
integration_expect(strpos($rawDuplicate, 'Key already installed.') !== false, 'raw POST duplicate must remain idempotent');
integration_expect((file_get_contents($rawAuthorizedKeys) ?: '') === $syntheticKey . "\n", 'raw POST duplicate must not append a second key');

$rawCrLfBody = $body . "\r\n";
$rawCrLfPostEnvironment = array_replace($baseEnvironment, [
    'REQUEST_METHOD' => 'POST',
    'SCRIPT_NAME' => $route,
    'QUERY_STRING' => '',
    'POST' => $rawCrLfBody,
    'CONTENT_LENGTH' => (string)strlen($rawCrLfBody),
]);
[$rawCrLfResult] = integration_run_role($entrypoint, $pluginRoot, $rawCrLfPostEnvironment);
integration_expect(strpos($rawCrLfResult, 'Request rejected: malformed or ambiguous form data.') === false, 'raw POST with a terminal CRLF must not be rejected as malformed or ambiguous');
integration_expect(strpos($rawCrLfResult, 'Key already installed.') !== false, 'raw POST terminal-CRLF form must reach idempotent key validation');
integration_expect((file_get_contents($authorizedKeys) ?: '') === $syntheticKey . "\n", 'raw POST terminal CRLF must not change the installed synthetic key');

$trailingSeparatorBody = $body . "&";
$trailingByteEnvironment = array_replace($baseEnvironment, [
    'REQUEST_METHOD' => 'POST',
    'SCRIPT_NAME' => $route,
    'QUERY_STRING' => 'pipe_post=yes',
    'POST' => 'stdin=true',
    'CONTENT_LENGTH' => (string)strlen($trailingSeparatorBody),
]);
[$rejected] = integration_run_role($entrypoint, $pluginRoot, $trailingByteEnvironment, $trailingSeparatorBody);
integration_expect(strpos($rejected, 'Request rejected: malformed or ambiguous form data.') !== false, 'an empty trailing form field must fail closed with the reported diagnostic');
integration_expect((file_get_contents($authorizedKeys) ?: '') === $syntheticKey . "\n", 'rejected trailing-separator form must not change authorized_keys');

$invalidHome = $fixture . '/embedded-newline-home';
integration_expect(@mkdir($invalidHome, 0700, true), 'embedded-newline HOME must be created');
$invalidSecretDirectory = $invalidHome . '/.titan-dev-access';
integration_expect(@mkdir($invalidSecretDirectory, 0700, true), 'embedded-newline HOME CSRF directory must be created');
$invalidSecretFile = $invalidSecretDirectory . '/csrf.key';
integration_expect(file_put_contents($invalidSecretFile, $secret, LOCK_EX) !== false, 'embedded-newline CSRF fixture must be written');
chmod($invalidSecretDirectory, 0700);
chmod($invalidSecretFile, 0600);
$invalidGetEnvironment = array_replace($baseEnvironment, [
    'HOME' => $invalidHome,
    'REQUEST_METHOD' => 'GET',
    'SCRIPT_NAME' => $route,
    'QUERY_STRING' => '',
]);
[$invalidHtml] = integration_run_role($entrypoint, $pluginRoot, $invalidGetEnvironment);
integration_expect(preg_match('/<input type="hidden" name="csrf" value="([a-f0-9]{64})">/', $invalidHtml, $invalidMatches) === 1, 'embedded-newline fixture must render its own CSRF token');
$embeddedNewlineKey = 'ssh-ed25519' . "\n" . 'AAAAC3NzaC1lZDI1NTE5AAAAINdamAGCsQq31Uv+08lkBzoO4XLz2qYjJa8CGmj3B1Ea synthetic-fixture';
$embeddedBody = http_build_query([
    'csrf' => $invalidMatches[1],
    'public_key' => $embeddedNewlineKey,
    'add_key' => '1',
], '', '&', PHP_QUERY_RFC1738);
[$invalidResult] = integration_run_role($entrypoint, $pluginRoot, array_replace($baseEnvironment, [
    'HOME' => $invalidHome,
    'REQUEST_METHOD' => 'POST',
    'SCRIPT_NAME' => $route,
    'QUERY_STRING' => '',
    'POST' => $embeddedBody,
    'CONTENT_LENGTH' => (string)strlen($embeddedBody),
]));
integration_expect(strpos($invalidResult, 'Invalid public key format.') !== false, 'embedded key CR/LF must fail at key-line validation');
integration_expect((file_get_contents($invalidHome . '/.ssh/authorized_keys') ?: '') === '', 'rejected embedded key newline must leave authorized_keys empty');

$duplicateHome = $fixture . '/duplicate-action-home';
integration_expect(@mkdir($duplicateHome, 0700, true), 'duplicate-action HOME must be created');
$duplicateSecretDirectory = $duplicateHome . '/.titan-dev-access';
integration_expect(@mkdir($duplicateSecretDirectory, 0700, true), 'duplicate-action HOME CSRF directory must be created');
$duplicateSecretFile = $duplicateSecretDirectory . '/csrf.key';
integration_expect(file_put_contents($duplicateSecretFile, $secret, LOCK_EX) !== false, 'duplicate-action CSRF fixture must be written');
chmod($duplicateSecretDirectory, 0700);
chmod($duplicateSecretFile, 0600);
$duplicateGetEnvironment = array_replace($baseEnvironment, [
    'HOME' => $duplicateHome,
    'REQUEST_METHOD' => 'GET',
    'SCRIPT_NAME' => $route,
    'QUERY_STRING' => '',
]);
[$duplicateHtml] = integration_run_role($entrypoint, $pluginRoot, $duplicateGetEnvironment);
integration_expect(preg_match('/<input type="hidden" name="csrf" value="([a-f0-9]{64})">/', $duplicateHtml, $duplicateMatches) === 1, 'duplicate-action fixture must render its own CSRF token');
$duplicateActionBody = http_build_query([
    'csrf' => $duplicateMatches[1],
    'public_key' => $syntheticKey,
    'add_key' => '1',
], '', '&', PHP_QUERY_RFC1738) . '&add_key=1' . "\n";
[$duplicateActionResult] = integration_run_role($entrypoint, $pluginRoot, array_replace($baseEnvironment, [
    'HOME' => $duplicateHome,
    'REQUEST_METHOD' => 'POST',
    'SCRIPT_NAME' => $route,
    'QUERY_STRING' => '',
    'POST' => $duplicateActionBody,
    'CONTENT_LENGTH' => (string)strlen($duplicateActionBody),
]));
integration_expect(strpos($duplicateActionResult, 'Request rejected: malformed or ambiguous form data.') !== false, 'terminal LF normalization must not permit duplicate add_key fields');
integration_expect((file_get_contents($duplicateHome . '/.ssh/authorized_keys') ?: '') === '', 'duplicate action rejection must leave authorized_keys empty');

$wrongActionBody = http_build_query([
    'csrf' => $duplicateMatches[1],
    'public_key' => $syntheticKey,
    'add_key' => '2',
], '', '&', PHP_QUERY_RFC1738) . "\r\n";
[$wrongActionResult] = integration_run_role($entrypoint, $pluginRoot, array_replace($baseEnvironment, [
    'HOME' => $duplicateHome,
    'REQUEST_METHOD' => 'POST',
    'SCRIPT_NAME' => $route,
    'QUERY_STRING' => '',
    'POST' => 'stdin=true',
    'CONTENT_LENGTH' => (string)strlen($wrongActionBody),
]), $wrongActionBody);
integration_expect(strpos($wrongActionResult, 'Request rejected: malformed or ambiguous form data.') !== false, 'terminal CRLF normalization must not relax exact add_key action validation');
integration_expect((file_get_contents($duplicateHome . '/.ssh/authorized_keys') ?: '') === '', 'wrong action rejection must leave authorized_keys empty');

echo "Synthetic key integration passed: textarea CRLF and one transport terminator normalize; embedded key newlines, duplicate fields, and non-exact actions fail closed.\n";
