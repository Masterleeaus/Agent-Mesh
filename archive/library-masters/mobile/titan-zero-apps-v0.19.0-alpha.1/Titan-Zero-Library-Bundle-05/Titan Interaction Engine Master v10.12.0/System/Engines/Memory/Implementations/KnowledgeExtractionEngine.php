<?php

declare(strict_types=1);

namespace App\Extensions\InteractionEngine\System\Engines\Memory\Implementations;

use App\Extensions\InteractionEngine\System\Engines\Memory\Contracts\KnowledgeExtractionEngineInterface;

class KnowledgeExtractionEngine implements KnowledgeExtractionEngineInterface
{
    public function extract(string $text): array
    {
        return [
            'entities' => $this->extractEntities($text),
            'facts' => $this->extractFacts($text),
            'relations' => $this->extractRelations($text),
        ];
    }

    public function extractFacts(string $text): array
    {
        $sentences = preg_split('/(?<=[.!?])\s+/', trim($text), -1, PREG_SPLIT_NO_EMPTY) ?: [];
        return array_values(array_map(static function (string $sentence): array {
            return [
                'statement' => rtrim(trim($sentence), '.!?'),
                'confidence' => 0.7,
                'source' => 'local_extraction',
            ];
        }, array_filter($sentences, static fn(string $sentence): bool => strlen(trim($sentence)) >= 3)));
    }

    public function extractRelations(string $text): array
    {
        $relations = [];
        $patterns = [
            '/\b([A-Za-z][A-Za-z\s_-]+?)\s+(requires|includes|contains|has|uses|creates)\s+(?:an?\s+|the\s+)?([A-Za-z][A-Za-z\s_-]+?)(?:[.!?]|$)/i',
            '/\b([A-Za-z][A-Za-z\s_-]+?)\s+is\s+(?:an?\s+|the\s+)?([A-Za-z][A-Za-z\s_-]+?)(?:[.!?]|$)/i',
        ];
        if (preg_match_all($patterns[0], $text, $matches, PREG_SET_ORDER)) {
            foreach ($matches as $match) {
                $relations[] = ['subject' => trim($match[1]), 'relation' => strtolower($match[2]), 'object' => trim($match[3]), 'confidence' => 0.8];
            }
        }
        if (preg_match_all($patterns[1], $text, $matches, PREG_SET_ORDER)) {
            foreach ($matches as $match) {
                $relations[] = ['subject' => trim($match[1]), 'relation' => 'is_a', 'object' => trim($match[2]), 'confidence' => 0.75];
            }
        }
        return $relations;
    }

    private function extractEntities(string $text): array
    {
        preg_match_all('/\b[A-Z][A-Za-z0-9_-]*(?:\s+[A-Z][A-Za-z0-9_-]*)*\b/', $text, $matches);
        return array_values(array_unique(array_filter($matches[0] ?? [], static fn(string $value): bool => strlen($value) > 1)));
    }
}
