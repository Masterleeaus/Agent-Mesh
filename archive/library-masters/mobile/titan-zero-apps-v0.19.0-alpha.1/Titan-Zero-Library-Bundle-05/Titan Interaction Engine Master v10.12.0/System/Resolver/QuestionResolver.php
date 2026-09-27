<?php

declare(strict_types=1);

namespace App\Extensions\InteractionEngine\System\Resolver;

use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;
use App\Extensions\InteractionEngine\System\Contracts\QuestionResolverInterface;
use App\Extensions\InteractionEngine\System\DTO\Answer;
use App\Extensions\InteractionEngine\System\DTO\Question;
use App\Extensions\InteractionEngine\System\Knowledge\KnowledgeRegistry;
use App\Extensions\InteractionEngine\System\Company\CompanyExecutionContext;

class QuestionResolver implements QuestionResolverInterface
{
    private array $resolvers = [];
    private array $defaultResolvers = [];

    public function __construct(
        private readonly KnowledgeRegistry $knowledge,
        private readonly CompanyExecutionContext $tenantContext,
    )
    {
        $this->registerDefaultResolvers();
    }

    public function registerResolver(string $type, callable $handler): void
    {
        $this->resolvers[$type] = $handler;
    }

    public function resolve(Question $question, array $context): Answer
    {
        if (isset($this->resolvers[$question->handling])) {
            $value = ($this->resolvers[$question->handling])($question, $context);
            return new Answer($question->key, $value, $question->handling, 1.0, new \DateTimeImmutable());
        }
        foreach ($this->defaultResolvers as $source => $resolver) {
            $result = $resolver($question, $context);
            if ($result !== null) {
                return new Answer($question->key, $result, $source, 0.8, new \DateTimeImmutable());
            }
        }
        return new Answer($question->key, null, 'user', null, new \DateTimeImmutable());
    }

    private function registerDefaultResolvers(): void
    {
        $this->defaultResolvers = [
            'cache' => fn(Question $q, array $c): mixed => $this->fromCache($q, $c),
            'knowledge' => fn(Question $q, array $c): mixed => $this->fromKnowledge($q, $c),
            'compute' => fn(Question $q, array $c): mixed => $this->fromSafeExpression($q, $c),
            'context' => fn(Question $q, array $c): mixed => $q->default ?? ($c['answers'][$q->key] ?? null),
        ];
    }

    private function fromCache(Question $question, array $context): mixed
    {
        $key = $this->tenantContext->cacheKey('answer:' . $question->key . ':' . hash('sha256', json_encode($context, JSON_THROW_ON_ERROR)));
        return Cache::has($key) ? Cache::get($key) : null;
    }

    private function fromKnowledge(Question $question, array $context): mixed
    {
        if (!$question->optionsSource) {
            return null;
        }
        $source = $this->knowledge->getSource($question->optionsSource);
        return $source ? $source->query($question->question, $context) : null;
    }

    private function fromSafeExpression(Question $question, array $context): mixed
    {
        $expression = $question->metadata['compute'] ?? null;
        if (!is_string($expression) || trim($expression) === '') {
            return null;
        }
        try {
            return $this->evaluateExpression(trim($expression), $context);
        } catch (\Throwable $e) {
            Log::warning('Safe compute resolver rejected expression', ['expression' => $expression, 'error' => $e->getMessage()]);
            return null;
        }
    }

    private function evaluateExpression(string $expression, array $context): mixed
    {
        if (preg_match('/^[A-Za-z_][A-Za-z0-9_.]*$/', $expression)) {
            $value = $context;
            foreach (explode('.', $expression) as $segment) {
                if (!is_array($value) || !array_key_exists($segment, $value)) {
                    return null;
                }
                $value = $value[$segment];
            }
            return $value;
        }
        if (str_starts_with($expression, '[') && str_ends_with($expression, ']')) {
            $json = preg_replace("/'([^'\\]*(?:\\.[^'\\]*)*)'/", '"$1"', $expression);
            $decoded = json_decode((string) $json, true, 512, JSON_THROW_ON_ERROR);
            if (!is_array($decoded)) {
                throw new \InvalidArgumentException('Only literal arrays are supported.');
            }
            return $decoded;
        }
        if (is_numeric($expression)) {
            return str_contains($expression, '.') ? (float) $expression : (int) $expression;
        }
        if (in_array(strtolower($expression), ['true', 'false', 'null'], true)) {
            return match (strtolower($expression)) { 'true' => true, 'false' => false, default => null };
        }
        throw new \InvalidArgumentException('Expression is outside the safe subset.');
    }
}
