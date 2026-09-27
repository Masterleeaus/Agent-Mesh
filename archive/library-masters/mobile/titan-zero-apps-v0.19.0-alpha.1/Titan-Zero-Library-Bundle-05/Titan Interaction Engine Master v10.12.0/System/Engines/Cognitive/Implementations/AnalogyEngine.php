<?php

declare(strict_types=1);

namespace App\Extensions\InteractionEngine\System\Engines\Cognitive\Implementations;

use App\Extensions\InteractionEngine\System\Engines\Cognitive\Contracts\AnalogyEngineInterface;

class AnalogyEngine implements AnalogyEngineInterface
{
    public function findAnalogies(string $problem): array
    {
        $tokens = $this->tokens($problem);
        $domains = [
            'workflow' => ['steps', 'sequence', 'process', 'queue'],
            'navigation' => ['path', 'route', 'direction', 'destination'],
            'resource_allocation' => ['capacity', 'load', 'scarcity', 'priority'],
            'feedback_loop' => ['feedback', 'adjust', 'learn', 'repeat'],
        ];
        $results = [];
        foreach ($domains as $domain => $keywords) {
            $overlap = count(array_intersect($tokens, $keywords));
            if ($overlap > 0) {
                $results[] = ['analogy' => $domain, 'score' => $overlap / count($keywords), 'shared_features' => array_values(array_intersect($tokens, $keywords))];
            }
        }
        usort($results, static fn(array $a, array $b): int => $b['score'] <=> $a['score']);
        return $results;
    }

    public function mapAnalogy(array $source, array $target): array
    {
        $mapping = [];
        foreach ($source as $key => $value) {
            if (array_key_exists($key, $target)) {
                $mapping[$key] = ['source' => $value, 'target' => $target[$key], 'relation' => 'same_attribute'];
            }
        }
        return $mapping;
    }

    public function applyAnalogy(array $source, array $target): array
    {
        $result = $target;
        foreach ($source as $key => $value) {
            if (!array_key_exists($key, $result)) {
                $result[$key] = $value;
            }
        }
        return ['result' => $result, 'mapping' => $this->mapAnalogy($source, $target)];
    }

    private function tokens(string $text): array
    {
        return array_values(array_unique(preg_split('/[^a-z0-9]+/i', strtolower($text), -1, PREG_SPLIT_NO_EMPTY) ?: []));
    }
}
