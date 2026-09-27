<?php

declare(strict_types=1);

namespace App\Extensions\InteractionEngine\System\Engines\HumanInteraction\Implementations;

use App\Extensions\InteractionEngine\System\Engines\HumanInteraction\Contracts\EmpathyEngineInterface;

/**
 * Distress-keyword detection driving a genuinely selected response
 * template and score, rather than the same fixed response for everyone.
 * Fixed during the fix pass: generateResponse() and getEmpathyScore()
 * both ignored $input and always returned the same string/0.8.
 */
class EmpathyEngine implements EmpathyEngineInterface
{
    private const HIGH_DISTRESS = ['angry', 'furious', 'terrible', 'unacceptable', 'worst', 'never again'];
    private const MODERATE_DISTRESS = ['frustrated', 'disappointed', 'confused', 'concerned', 'worried'];

    public function generateResponse(string $input): string
    {
        $level = $this->distressLevel($input);

        return match ($level) {
            'high' => "I'm sorry — that sounds genuinely frustrating, and I want to help get this fixed as quickly as possible.",
            'moderate' => 'I understand this is concerning. Let me help you work through it.',
            default => "Thanks for sharing that — let's look at it together.",
        };
    }

    public function getEmpathyScore(string $input): float
    {
        return match ($this->distressLevel($input)) {
            'high' => 0.95,
            'moderate' => 0.7,
            default => 0.4,
        };
    }

    public function listEmpathyStrategies(): array
    {
        return ['acknowledge', 'validate', 'support'];
    }

    private function distressLevel(string $input): string
    {
        $lower = strtolower($input);
        foreach (self::HIGH_DISTRESS as $word) {
            if (str_contains($lower, $word)) {
                return 'high';
            }
        }
        foreach (self::MODERATE_DISTRESS as $word) {
            if (str_contains($lower, $word)) {
                return 'moderate';
            }
        }
        return 'low';
    }
}
