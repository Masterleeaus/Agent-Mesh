<?php

declare(strict_types=1);

namespace Modules\CustomerFeedback\Services;

final class ComplaintAnalysisService
{
    private const URGENT_KEYWORDS = ['urgent', 'immediately', 'danger', 'unsafe', 'hazard'];
    private const HIGH_KEYWORDS = ['bad', 'unhappy', 'refund', 'failed', 'damage'];
    private const LOW_KEYWORDS = ['minor', 'small', 'cosmetic'];
    private const BILLING_KEYWORDS = ['refund', 'billing', 'invoice', 'charge'];
    private const DELAY_KEYWORDS = ['late', 'delay', 'missed', 'no show'];
    private const QUALITY_KEYWORDS = ['clean', 'quality', 'reclean', 'inspection', 'standard'];

    /** @return array{severity:string,category:string,resolution_suggestion:string} */
    public function analyse(string $subject, string $description = ''): array
    {
        $text = strtolower(trim($subject . ' ' . $description));
        $severity = 'medium';
        if ($this->containsAny($text, self::URGENT_KEYWORDS)) {
            $severity = 'urgent';
        } elseif ($this->containsAny($text, self::HIGH_KEYWORDS)) {
            $severity = 'high';
        } elseif ($this->containsAny($text, self::LOW_KEYWORDS)) {
            $severity = 'low';
        }

        $category = 'general';
        if ($this->containsAny($text, self::BILLING_KEYWORDS)) {
            $category = 'billing';
        } elseif ($this->containsAny($text, self::DELAY_KEYWORDS)) {
            $category = 'service-delay';
        } elseif ($this->containsAny($text, self::QUALITY_KEYWORDS)) {
            $category = 'service-quality';
        }

        $suggestion = match ($category) {
            'billing' => 'Review invoice details and offer adjustment or refund only where policy and authority permit.',
            'service-delay' => 'Acknowledge the delay, identify the cause, and offer an authorised recovery option.',
            'service-quality' => 'Arrange a quality verification and request corrective or re-clean work if standards were missed.',
            default => 'Acknowledge the concern, investigate the facts, and provide a clear resolution timeline.',
        };

        return ['severity' => $severity, 'category' => $category, 'resolution_suggestion' => $suggestion];
    }

    /** @return array{message:string,tone:string} */
    public function draftResponse(string $subject, string $resolutionSuggestion, string $tone = 'empathetic'): array
    {
        return [
            'message' => sprintf(
                'Thank you for raising this concern about "%s". We are reviewing it now. %s',
                trim($subject) !== '' ? trim($subject) : 'your recent experience',
                trim($resolutionSuggestion)
            ),
            'tone' => $tone,
        ];
    }

    /** @param list<string> $needles */
    private function containsAny(string $haystack, array $needles): bool
    {
        foreach ($needles as $needle) {
            if (str_contains($haystack, $needle)) {
                return true;
            }
        }
        return false;
    }
}
