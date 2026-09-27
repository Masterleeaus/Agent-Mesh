#!/usr/bin/env php
<?php

declare(strict_types=1);

$root = dirname(__DIR__);
spl_autoload_register(static function (string $class) use ($root): void {
    $prefix = 'App\\Extensions\\InteractionEngine\\System\\';
    if (!str_starts_with($class, $prefix)) {
        return;
    }

    $relative = substr($class, strlen($prefix));
    $path = $root . '/System/' . str_replace('\\', '/', $relative) . '.php';
    if (is_file($path)) {
        require_once $path;
    }
});

try {
    $raw = stream_get_contents(STDIN);
    $input = json_decode($raw === false ? '' : $raw, true, 512, JSON_THROW_ON_ERROR);
    $message = trim((string) ($input['message'] ?? ''));
    if ($message === '') {
        throw new InvalidArgumentException('message is required');
    }
    $context = is_array($input['context'] ?? null) ? $input['context'] : [];
    $context['company_id'] = (string) ($context['company_id'] ?? 'local-standalone');
    $context['company_id'] = $context['company_id']; // compatibility alias only
    $context['user_id'] = (string) ($context['user_id'] ?? 'anonymous');
    $context['correlation_id'] = (string) ($context['correlation_id'] ?? bin2hex(random_bytes(12)));
    $brain = App\Extensions\InteractionEngine\System\LocalIntelligence\LocalBrain::createDefault();
    $result = $brain->process($message, $context);
    $memories = is_array($input['memories'] ?? null) ? $input['memories'] : [];
    if ($memories !== []) {
        $tokens = static function (string $text): array {
            $normalized = function_exists('mb_strtolower') ? mb_strtolower($text) : strtolower($text);
            return array_values(array_unique(preg_split('/[^\p{L}\p{N}]+/u', $normalized, -1, PREG_SPLIT_NO_EMPTY) ?: []));
        };
        $queryTokens = $tokens($message);
        $candidates = [];
        foreach ($memories as $memory) {
            if (!is_array($memory) || trim((string) ($memory['content'] ?? '')) === '') {
                continue;
            }
            $memoryTokens = $tokens((string) $memory['content']);
            $intersection = count(array_intersect($queryTokens, $memoryTokens));
            $union = count(array_unique(array_merge($queryTokens, $memoryTokens)));
            $memory['semantic_similarity'] = $union > 0 ? $intersection / $union : 0.0;
            $memory['emotional_intensity'] = (float) ($memory['emotional_intensity'] ?? 0.0);
            $memory['timestamp'] = (string) ($memory['timestamp'] ?? gmdate(DATE_ATOM));
            $candidates[] = $memory;
        }
        $ranked = $brain->rankMemories($candidates, new DateTimeImmutable(), 5);
        $rankedMemories = [];
        if (is_array($ranked['most_relevant'] ?? null)) {
            $rankedMemories[] = $ranked['most_relevant'];
        }
        foreach ((array) ($ranked['alternatives'] ?? []) as $candidate) {
            if (is_array($candidate)) {
                $rankedMemories[] = $candidate;
            }
        }
        foreach ((array) ($ranked['contradictions'] ?? []) as $candidate) {
            if (is_array($candidate)) {
                $rankedMemories[] = $candidate;
            }
        }
        $result['ranked_memories'] = $rankedMemories;
        $result['memory_contradictions'] = (array) ($ranked['contradictions'] ?? []);
    } else {
        $result['ranked_memories'] = [];
        $result['memory_contradictions'] = [];
    }
    echo json_encode(['ok' => true, 'result' => $result], JSON_THROW_ON_ERROR | JSON_UNESCAPED_SLASHES), PHP_EOL;
    exit(0);
} catch (Throwable $error) {
    fwrite(STDERR, $error->getMessage() . PHP_EOL);
    echo json_encode(['ok' => false, 'error' => $error->getMessage()], JSON_UNESCAPED_SLASHES), PHP_EOL;
    exit(1);
}
