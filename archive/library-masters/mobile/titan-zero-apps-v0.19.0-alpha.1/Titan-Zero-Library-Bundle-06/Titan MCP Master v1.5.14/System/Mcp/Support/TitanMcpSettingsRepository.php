<?php

declare(strict_types=1);

namespace App\Extensions\TitanMcp\System\Mcp\Support;

final class TitanMcpSettingsRepository
{
    private const ALLOWED = [
        'enabled','auth.require_token_scope','http.cors_origins','http.rate_limit_ip_per_minute','http.rate_limit_actor_per_minute',
        'security.storage_encryption_attested','repository.max_write_bytes','database.query_enabled','write.enabled','write.database_enabled','destructive.enabled',
        'backups.retention_days','backups.retention_max_deletes_per_run','execution.enabled','execution.timeout_seconds',
        'execution.readonly_timeout_seconds','execution.max_output_chars','execution.recover_failed_mutations','execution.mutation_lock_timeout_seconds',
        'mutation_tickets.default_ttl_seconds','mutation_tickets.max_ttl_seconds',
    ];

    public function __construct(private readonly string $path) {}

    public function all(): array
    {
        if (!is_file($this->path)) return [];
        $raw = @file_get_contents($this->path);
        if ($raw === false || $raw === '') return [];
        $data = json_decode($raw, true);
        if (!is_array($data)) return [];
        return array_intersect_key($data, array_flip(self::ALLOWED));
    }

    public function applyToConfig(): void
    {
        foreach ($this->all() as $key => $value) config()->set('titan_mcp.'.$key, $value);
    }

    public function replace(array $values): void
    {
        $values = array_intersect_key($values, array_flip(self::ALLOWED));
        $dir = dirname($this->path);
        if (!is_dir($dir) && !@mkdir($dir, 0700, true) && !is_dir($dir)) throw new \RuntimeException('Unable to create Titan MCP settings directory.');
        if (is_link($dir) || is_link($this->path)) throw new \RuntimeException('Titan MCP settings path may not be a symlink.');
        $json = json_encode($values, JSON_PRETTY_PRINT|JSON_UNESCAPED_SLASHES|JSON_THROW_ON_ERROR)."\n";
        $tmp = $this->path.'.tmp.'.bin2hex(random_bytes(6));
        if (@file_put_contents($tmp, $json, LOCK_EX) === false) throw new \RuntimeException('Unable to write Titan MCP settings.');
        @chmod($tmp, 0600);
        if (!@rename($tmp, $this->path)) { @unlink($tmp); throw new \RuntimeException('Unable to commit Titan MCP settings.'); }
        @chmod($this->path, 0600);
    }

    public static function allowedKeys(): array { return self::ALLOWED; }
}
