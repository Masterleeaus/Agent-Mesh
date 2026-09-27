<?php

declare(strict_types=1);

namespace App\Extensions\InteractionEngine\System\Resolver\Resolvers;

use App\Extensions\InteractionEngine\System\DTO\Question;
use App\Extensions\InteractionEngine\System\DTO\Answer;
use App\Extensions\InteractionEngine\System\Contracts\QuestionResolverInterface;
use App\Extensions\InteractionEngine\System\AI\AIServiceInterface;

class AIResolver implements QuestionResolverInterface
{
    private AIServiceInterface $aiService;

    public function __construct(AIServiceInterface $aiService)
    {
        $this->aiService = $aiService;
    }

    public function resolve(Question $question, array $context): Answer
    {
        if ($question->handling !== 'ai') {
            return new Answer(
                questionKey: $question->key,
                value: null,
                source: 'ai',
                confidence: 0,
                timestamp: new \DateTimeImmutable()
            );
        }

        try {
            $prompt = $this->buildPrompt($question, $context);
            $response = $this->aiService->generate($prompt);
            $value = $this->parseResponse($response, $question);

            return new Answer(
                questionKey: $question->key,
                value: $value,
                source: 'ai',
                confidence: 0.9,
                timestamp: new \DateTimeImmutable()
            );
        } catch (\Exception $e) {
            \Log::error('AI resolver failed', ['question' => $question->key, 'error' => $e->getMessage()]);
            return new Answer(
                questionKey: $question->key,
                value: null,
                source: 'ai',
                confidence: 0,
                timestamp: new \DateTimeImmutable()
            );
        }
    }

    private function buildPrompt(Question $question, array $context): string
    {
        $contextStr = json_encode($context);
        return "Question: {$question->question}\nContext: {$contextStr}\nProvide a concise answer. Return only the answer, no explanation.";
    }

    private function parseResponse(string $response, Question $question): mixed
    {
        // Depending on response_type, parse accordingly
        switch ($question->responseType) {
            case 'boolean':
                return filter_var(trim($response), FILTER_VALIDATE_BOOLEAN);
            case 'integer':
                return (int) trim($response);
            case 'money':
            case 'float':
                return (float) trim($response);
            case 'select':
                // Check if response matches one of the options
                $options = $question->options;
                foreach ($options as $option) {
                    if (str_contains(strtolower($response), strtolower($option['label'] ?? $option))) {
                        return $option['value'] ?? $option;
                    }
                }
                return $response;
            default:
                return trim($response);
        }
    }
}
