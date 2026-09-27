<?php

declare(strict_types=1);

namespace App\Extensions\InteractionEngine\System\Pattern;

use Illuminate\Support\Facades\Cache;
use App\Extensions\InteractionEngine\System\Company\CompanyExecutionContext;

class PatternRegistry
{
    private array $patterns = [];
    private string $cacheKey;

    public function __construct(private readonly CompanyExecutionContext $tenantContext)
    {
        $this->cacheKey = $this->tenantContext->cacheKey('patterns');
        $this->loadPatterns();
    }

    public function register(string $name, array $pattern): void
    {
        if (empty($pattern['conditions'])) {
            throw new \InvalidArgumentException('A pattern requires at least one condition.');
        }
        $this->patterns[$name] = $pattern;
        $this->savePatterns();
    }

    public function get(string $name): ?array { return $this->patterns[$name] ?? null; }

    public function match(array $context): array
    {
        $matches = [];
        foreach ($this->patterns as $name => $pattern) {
            $matched = 0;
            $conditions = $pattern['conditions'] ?? [];
            foreach ($conditions as $key => $value) {
                if (array_key_exists($key, $context) && $context[$key] === $value) {
                    $matched++;
                }
            }
            if ($matched === count($conditions) && $conditions !== []) {
                $matches[] = [
                    'name' => $name,
                    'pattern' => $pattern,
                    'confidence' => (float) ($pattern['confidence'] ?? 1.0),
                    'evidence_count' => $matched,
                ];
            }
        }
        usort($matches, static fn(array $a, array $b): int => $b['confidence'] <=> $a['confidence']);
        return $matches;
    }

    public function learn(array $context, array $outcome): void
    {
        $pattern = $this->extractPattern($context, $outcome);
        if ($pattern !== null) {
            $hash = hash('sha256', json_encode($pattern, JSON_THROW_ON_ERROR | JSON_UNESCAPED_SLASHES));
            $this->patterns['learned_' . substr($hash, 0, 16)] = $pattern;
            $this->savePatterns();
        }
    }

    private function extractPattern(array $context, array $outcome): ?array
    {
        $success = (bool) ($outcome['success'] ?? $outcome['completed'] ?? false);
        if (!$success || $context === []) {
            return null;
        }
        $conditions = [];
        foreach ($context as $key => $value) {
            if ((is_scalar($value) || $value === null) && !in_array($key, ['timestamp', 'request_id', 'token'], true)) {
                $conditions[$key] = $value;
            }
            if (count($conditions) >= 8) {
                break;
            }
        }
        return $conditions === [] ? null : [
            'conditions' => $conditions,
            'outcome' => array_intersect_key($outcome, array_flip(['action', 'interaction_id', 'capability', 'success'])),
            'confidence' => (float) ($outcome['confidence'] ?? 0.7),
            'learned_at' => gmdate(DATE_ATOM),
        ];
    }

    private function loadPatterns(): void
    {
        try { $this->patterns = Cache::get($this->cacheKey, []); } catch (\Throwable) { $this->patterns = []; }
    }

    private function savePatterns(): void
    {
        try { Cache::put($this->cacheKey, $this->patterns, 86400 * 30); } catch (\Throwable) {}
    }
}
