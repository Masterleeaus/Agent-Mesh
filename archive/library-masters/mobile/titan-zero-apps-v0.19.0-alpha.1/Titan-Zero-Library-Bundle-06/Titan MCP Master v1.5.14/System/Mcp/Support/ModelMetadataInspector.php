<?php

declare(strict_types=1);

namespace App\Extensions\TitanMcp\System\Mcp\Support;

use InvalidArgumentException;
use RecursiveDirectoryIterator;
use RecursiveIteratorIterator;
use RuntimeException;

final class ModelMetadataInspector
{
    private readonly string $root;

    public function __construct(string $projectRoot)
    {
        $root = realpath($projectRoot);
        if ($root === false || !is_dir($root)) throw new RuntimeException('Titan MCP project root does not exist.');
        $this->root = rtrim($root, DIRECTORY_SEPARATOR);
    }

    /** @return array{models:list<array<string,mixed>>,count:int,total_candidates:int,truncated:bool,mode:string} */
    public function inspectExtension(string $extension, int $limit = 100): array
    {
        if (preg_match('/^[A-Za-z0-9_-]+$/', $extension) !== 1) throw new InvalidArgumentException('Invalid extension name.');
        $base = $this->root.DIRECTORY_SEPARATOR.'app'.DIRECTORY_SEPARATOR.'Extensions'.DIRECTORY_SEPARATOR.$extension;
        if (!is_dir($base) || is_link($base)) return ['models' => [], 'count' => 0, 'total_candidates' => 0, 'truncated' => false, 'mode' => 'static_source_only'];
        $realBase = realpath($base);
        if ($realBase === false || !$this->within($realBase, $this->root.DIRECTORY_SEPARATOR.'app'.DIRECTORY_SEPARATOR.'Extensions')) {
            throw new InvalidArgumentException('Extension model root resolves outside app/Extensions.');
        }

        $candidates = [];
        $it = new RecursiveIteratorIterator(new RecursiveDirectoryIterator($realBase, \FilesystemIterator::SKIP_DOTS));
        foreach ($it as $file) {
            if (!$file->isFile() || $file->isLink() || strtolower($file->getExtension()) !== 'php') continue;
            $path = str_replace('\\', '/', $file->getPathname());
            if (!str_contains(strtolower($path), '/model')) continue;
            $real = realpath($file->getPathname());
            if ($real === false || !$this->within($real, $realBase)) continue;
            $source = (string) file_get_contents($real);
            if (!preg_match('/\bclass\s+[A-Za-z_][A-Za-z0-9_]*\s+extends\s+(?:\\\\)?(?:[A-Za-z_][A-Za-z0-9_]*\\\\)*Model\b/s', $source)) continue;
            $candidates[] = $real;
        }
        usort($candidates, static fn (string $a, string $b): int => strnatcasecmp($a, $b) ?: strcmp($a, $b));
        $total = count($candidates);
        $limit = min(max($limit, 1), 500);
        $models = [];
        foreach (array_slice($candidates, 0, $limit) as $path) {
            $metadata = $this->parseModel($path, $realBase, $extension);
            if ($metadata !== null) $models[] = $metadata;
        }
        return [
            'models' => $models,
            'count' => count($models),
            'total_candidates' => $total,
            'truncated' => $total > count($models),
            'mode' => 'static_source_only',
        ];
    }

    /** @return array<string,mixed>|null */
    private function parseModel(string $path, string $extensionRoot, string $extension): ?array
    {
        $source = (string) file_get_contents($path);
        if (!preg_match('/\bnamespace\s+([^;]+);/s', $source, $nm)) return null;
        if (!preg_match('/\bclass\s+([A-Za-z_][A-Za-z0-9_]*)\s+extends\s+([^\s\{]+)/s', $source, $cm)) return null;
        $namespace = trim($nm[1]);
        $class = trim($cm[1]);
        $parent = trim($cm[2]);
        $relative = ltrim(str_replace('\\', '/', substr($path, strlen(rtrim($extensionRoot, DIRECTORY_SEPARATOR)))), '/');
        $fillable = $this->stringListProperty($source, 'fillable');
        $hidden = $this->stringListProperty($source, 'hidden');
        sort($fillable, SORT_STRING);
        sort($hidden, SORT_STRING);
        $casts = $this->stringMapProperty($source, 'casts');
        ksort($casts, SORT_STRING);
        $relations = $this->relationMethods($source);
        sort($relations, SORT_STRING);

        return [
            'class' => $namespace.'\\'.$class,
            'short_name' => $class,
            'parent' => $parent,
            'path' => 'app/Extensions/'.$extension.'/'.$relative,
            'table' => $this->stringProperty($source, 'table'),
            'fillable' => $fillable,
            'hidden' => $hidden,
            'casts' => $casts,
            'relations' => $relations,
            'inspection_mode' => 'static_source_only',
        ];
    }

    private function stringProperty(string $source, string $name): ?string
    {
        if (preg_match('/(?:protected|public|private)\s+\$'.preg_quote($name, '/').'\s*=\s*([\'\"])(.*?)\1\s*;/s', $source, $m) !== 1) return null;
        return stripcslashes($m[2]);
    }

    /** @return list<string> */
    private function stringListProperty(string $source, string $name): array
    {
        $body = $this->arrayPropertyBody($source, $name);
        if ($body === null) return [];
        preg_match_all('/([\'\"])((?:\\\\.|(?!\1).)*)\1/sU', $body, $matches);
        return array_values(array_unique(array_map('stripcslashes', $matches[2] ?? [])));
    }

    /** @return array<string,string> */
    private function stringMapProperty(string $source, string $name): array
    {
        $body = $this->arrayPropertyBody($source, $name);
        if ($body === null) return [];
        $result = [];
        if (preg_match_all('/([\'\"])((?:\\\\.|(?!\1).)*)\1\s*=>\s*([\'\"])((?:\\\\.|(?!\3).)*)\3/sU', $body, $matches, PREG_SET_ORDER)) {
            foreach ($matches as $m) $result[stripcslashes($m[2])] = stripcslashes($m[4]);
        }
        return $result;
    }

    private function arrayPropertyBody(string $source, string $name): ?string
    {
        $pattern = '/(?:protected|public|private)\s+\$'.preg_quote($name, '/').'\s*=\s*\[(.*?)\]\s*;/s';
        return preg_match($pattern, $source, $m) === 1 ? $m[1] : null;
    }

    /** @return list<string> */
    private function relationMethods(string $source): array
    {
        $tokens = token_get_all($source);
        $relations = [];
        $count = count($tokens);
        for ($i = 0; $i < $count; $i++) {
            if (!is_array($tokens[$i]) || $tokens[$i][0] !== T_FUNCTION) continue;
            $name = null;
            for ($j = $i + 1; $j < $count; $j++) {
                if (is_array($tokens[$j]) && $tokens[$j][0] === T_STRING) { $name = $tokens[$j][1]; break; }
                if ($tokens[$j] === '{' || $tokens[$j] === ';') break;
            }
            if ($name === null) continue;
            while ($j < $count && $tokens[$j] !== '{' && $tokens[$j] !== ';') $j++;
            if ($j >= $count || $tokens[$j] !== '{') continue;
            $depth = 0; $body = '';
            for ($k = $j; $k < $count; $k++) {
                $tok = $tokens[$k];
                if ($tok === '{') $depth++;
                if ($tok === '}') { $depth--; if ($depth === 0) break; }
                if ($depth > 0) $body .= is_array($tok) ? $tok[1] : $tok;
            }
            if (preg_match('/->\s*(belongsTo|belongsToMany|hasOne|hasMany|hasOneThrough|hasManyThrough|morphTo|morphOne|morphMany|morphToMany|morphedByMany)\s*\(/i', $body) === 1) {
                $relations[] = $name;
            }
        }
        return array_values(array_unique($relations));
    }

    private function within(string $path, string $root): bool
    {
        $path = rtrim(str_replace('\\', '/', $path), '/');
        $rootReal = realpath($root);
        if ($rootReal === false) return false;
        $root = rtrim(str_replace('\\', '/', $rootReal), '/');
        return $path === $root || str_starts_with($path, $root.'/');
    }
}
