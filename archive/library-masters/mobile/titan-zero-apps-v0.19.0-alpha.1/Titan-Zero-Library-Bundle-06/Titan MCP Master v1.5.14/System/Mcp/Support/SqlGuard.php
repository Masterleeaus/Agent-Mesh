<?php

declare(strict_types=1);

namespace App\Extensions\TitanMcp\System\Mcp\Support;

use InvalidArgumentException;

final class SqlGuard
{
    private const WRITE_KEYWORDS = 'DELETE|UPDATE|DROP|ALTER|TRUNCATE|RENAME|CREATE|MERGE';
    private const SENSITIVE_IDENTIFIER = '/\b(?:password(?:_[a-z0-9]+)*|passwd(?:_[a-z0-9]+)*|secret(?:_[a-z0-9]+)*|[a-z0-9]+_token(?:_[a-z0-9]+)*|token(?:_[a-z0-9]+)*|api_keys?|(?:api_)?key_hash|private_key|client_secret|credentials?|remember_token|google2fa_secret|oauth_private_key)\b/i';
    private const SERVER_FILE_FUNCTION = '/\b(load_file|pg_read_file|pg_read_binary_file|pg_ls_dir|pg_stat_file|lo_import|lo_export)\s*\(/i';
    private const SIDE_EFFECT_FUNCTION = '/\b(sleep|benchmark|get_lock|release_lock|release_all_locks|is_free_lock|is_used_lock|master_pos_wait|source_pos_wait|last_insert_id)\s*\(/i';

    public function assertReadOnly(string $sql): void
    {
        $statement = trim($sql);
        if ($statement === '') throw new InvalidArgumentException('SQL query cannot be empty.');

        $parsed = $this->withoutLiteralsAndComments($statement);
        $structure = $parsed['structure'];
        if ($parsed['hasExecutableComment'] || $this->hasStackedStatements($structure)) {
            throw new InvalidArgumentException('Only one non-executable-comment read-only SQL statement is allowed.');
        }

        $firstWord = strtoupper((string) strtok(ltrim($structure), " \t\n\r"));
        if (!in_array($firstWord, ['SELECT', 'SHOW', 'EXPLAIN', 'DESCRIBE', 'DESC', 'WITH', 'VALUES', 'TABLE'], true)) {
            throw new InvalidArgumentException('Only read-only SQL is accepted by this tool.');
        }

        if ($firstWord === 'SHOW' && !$this->isSafeShow($structure)) {
            throw new InvalidArgumentException('Only table/schema SHOW statements are exposed through Titan MCP.');
        }
        if ($firstWord === 'WITH' && !preg_match('/\)\s*SELECT\b/i', $structure)) {
            throw new InvalidArgumentException('WITH queries must resolve to SELECT.');
        }
        if (preg_match('/(^|[();])\s*(?:(?:'.self::WRITE_KEYWORDS.')\b|(?:INSERT|REPLACE)\b(?!\s*\())/i', $structure)) {
            throw new InvalidArgumentException('Mutation keyword detected in read-only SQL.');
        }
        if ($firstWord === 'EXPLAIN') {
            if (preg_match('/^\s*EXPLAIN\s+(?:ANALYZE\b|ANALYSE\b)/i', $structure)) {
                throw new InvalidArgumentException('EXPLAIN ANALYZE executes the target query and is not allowed.');
            }
            if (preg_match('/^\s*EXPLAIN\s+(?:\([^)]*\)\s*|(?:VERBOSE|QUERY\s+PLAN|FORMAT\s*=?\s*\w+)\s+)*(?:'.self::WRITE_KEYWORDS.'|INSERT|REPLACE)\b/i', $structure)) {
                throw new InvalidArgumentException('EXPLAIN may only target read statements.');
            }
        }
        if (preg_match('/\bINTO\b/i', $structure)) throw new InvalidArgumentException('SELECT/statement INTO is not allowed.');
        if (preg_match('/\bFOR\s+(?:NO\s+KEY\s+)?UPDATE\b|\bFOR\s+SHARE\b|\bLOCK\s+IN\s+SHARE\s+MODE\b/i', $structure)) {
            throw new InvalidArgumentException('Locking reads are not allowed.');
        }
        if (preg_match('/(^|[^:]):=/', $structure)) throw new InvalidArgumentException('Session-variable assignment is not allowed.');
        if (preg_match(self::SERVER_FILE_FUNCTION, $structure)) throw new InvalidArgumentException('Server-side file access functions are not allowed.');
        if (preg_match(self::SIDE_EFFECT_FUNCTION, $structure)) throw new InvalidArgumentException('Side-effecting or resource-control functions are not allowed.');
        if (preg_match(self::SENSITIVE_IDENTIFIER, $structure)) throw new InvalidArgumentException('Queries that explicitly target credential-bearing fields are not allowed.');
        foreach ($parsed['quotedIdentifiers'] as $identifier) {
            if (preg_match(self::SENSITIVE_IDENTIFIER, $identifier)) {
                throw new InvalidArgumentException('Queries that explicitly target credential-bearing fields are not allowed.');
            }
        }
    }

    /** @return array{statement:string,destructive:bool} */
    public function assertMutation(string $sql): array
    {
        $statement = trim($sql);
        if ($statement === '') throw new InvalidArgumentException('SQL mutation cannot be empty.');
        $parsed = $this->withoutLiteralsAndComments($statement);
        $structure = $parsed['structure'];
        if ($parsed['hasExecutableComment'] || $this->hasStackedStatements($structure)) {
            throw new InvalidArgumentException('Exactly one SQL mutation statement is allowed.');
        }

        $firstWord = strtoupper((string) strtok(ltrim($structure), " \t\n\r"));
        if (!in_array($firstWord, ['INSERT', 'UPDATE', 'DELETE', 'REPLACE', 'CREATE', 'ALTER', 'DROP', 'TRUNCATE', 'RENAME'], true)) {
            throw new InvalidArgumentException('Only INSERT/UPDATE/DELETE/REPLACE and table/index DDL are exposed through Titan MCP.');
        }
        if (preg_match('/\b(create\s+user|alter\s+user|drop\s+user|rename\s+user|set\s+password|grant\s+|revoke\s+|create\s+role|drop\s+role|drop\s+database|create\s+database|alter\s+database|install\s+plugin|uninstall\s+plugin|shutdown\b|kill\s+)/i', $structure)) {
            throw new InvalidArgumentException('Server/account administration SQL is not exposed through Titan MCP.');
        }
        if (preg_match('/\bINTO\s+(OUTFILE|DUMPFILE)\b|\bLOAD\s+DATA\b/i', $structure) || preg_match(self::SERVER_FILE_FUNCTION, $structure)) {
            throw new InvalidArgumentException('Server-side file import/export is not allowed.');
        }

        // Generic MCP mutations deliberately expose only row DML plus table/index DDL.
        // Stored programs, triggers, views and other executable schema objects must use a dedicated governed path.
        $ddlAllowed = match ($firstWord) {
            'CREATE' => (bool) preg_match('/^\s*CREATE\s+(?:UNIQUE\s+)?(?:TABLE|INDEX)\b/i', $structure),
            'ALTER' => (bool) preg_match('/^\s*ALTER\s+TABLE\b/i', $structure),
            'DROP' => (bool) preg_match('/^\s*DROP\s+(?:TABLE|INDEX)\b/i', $structure),
            'TRUNCATE' => (bool) preg_match('/^\s*TRUNCATE\s+(?:TABLE\s+)?/i', $structure),
            'RENAME' => (bool) preg_match('/^\s*RENAME\s+TABLE\b/i', $structure),
            default => true,
        };
        if (!$ddlAllowed) {
            throw new InvalidArgumentException('Only table/index DDL is exposed through the generic Titan MCP mutation tool.');
        }

        $destructive = in_array($firstWord, ['DELETE', 'REPLACE', 'DROP', 'TRUNCATE', 'RENAME', 'ALTER'], true);
        if ($firstWord === 'UPDATE' && preg_match('/\bWHERE\b/i', $structure) !== 1) {
            $destructive = true;
        }
        return ['statement' => $statement, 'destructive' => $destructive];
    }

    /** @return array{structure:string,hasExecutableComment:bool,quotedIdentifiers:list<string>} */
    private function withoutLiteralsAndComments(string $query): array
    {
        $structure = '';
        $state = 'none';
        $hasExecutableComment = false;
        $quotedIdentifiers = [];
        $quotedBuffer = '';
        $length = strlen($query);

        for ($i = 0; $i < $length; $i++) {
            $char = $query[$i];
            $next = $query[$i + 1] ?? '';

            if ($state === 'none') {
                if ($char === "'") { $state = 'single'; $structure .= ' '; }
                elseif ($char === '"') { $state = 'double'; $quotedBuffer = ''; $structure .= ' '; }
                elseif ($char === '`') { $state = 'backtick'; $quotedBuffer = ''; $structure .= ' '; }
                elseif ($char === '-' && $next === '-' && (($query[$i + 2] ?? '') === '' || ctype_space($query[$i + 2]))) { $state = 'line_comment'; $structure .= ' '; $i++; }
                elseif ($char === '#') { $state = 'line_comment'; $structure .= ' '; }
                elseif ($char === '/' && $next === '*') {
                    $third = $query[$i + 2] ?? '';
                    $fourth = $query[$i + 3] ?? '';
                    if ($third === '!' || (($third === 'M' || $third === 'm') && $fourth === '!')) {
                        $hasExecutableComment = true;
                    }
                    $state = 'block_comment'; $structure .= ' '; $i++;
                } else { $structure .= $char; }
            } elseif ($state === 'line_comment') {
                if ($char === "\n") { $state = 'none'; $structure .= $char; }
            } elseif ($state === 'block_comment') {
                if ($char === '*' && $next === '/') { $state = 'none'; $i++; }
            } elseif ($state === 'single') {
                if ($char === "'") {
                    if ($next === "'") $i++; else $state = 'none';
                } elseif ($char === '\\') { $i++; }
            } else {
                $quote = $state === 'double' ? '"' : '`';
                if ($char === $quote) {
                    if ($next === $quote) { $quotedBuffer .= $quote; $i++; }
                    else { $quotedIdentifiers[] = $quotedBuffer; $quotedBuffer = ''; $state = 'none'; }
                } else { $quotedBuffer .= $char; }
            }
        }
        if ($state === 'double' || $state === 'backtick') $quotedIdentifiers[] = $quotedBuffer;
        return ['structure' => $structure, 'hasExecutableComment' => $hasExecutableComment, 'quotedIdentifiers' => $quotedIdentifiers];
    }

    private function isSafeShow(string $structure): bool
    {
        return (bool) preg_match('/^\s*SHOW\s+(?:FULL\s+)?(?:TABLES\b|COLUMNS\b|FIELDS\b|INDEX(?:ES)?\b|KEYS\b|CREATE\s+(?:TABLE|VIEW)\b)/i', $structure);
    }

    private function hasStackedStatements(string $structure): bool
    {
        $trimmed = rtrim($structure);
        if (str_ends_with($trimmed, ';')) $trimmed = rtrim(substr($trimmed, 0, -1));
        return str_contains($trimmed, ';');
    }
}
