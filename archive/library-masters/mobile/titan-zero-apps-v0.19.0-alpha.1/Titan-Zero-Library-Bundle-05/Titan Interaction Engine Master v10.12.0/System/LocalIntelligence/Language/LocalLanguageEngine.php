<?php

declare(strict_types=1);

namespace App\Extensions\InteractionEngine\System\LocalIntelligence\Language;

final class LocalLanguageEngine
{
    private array $intentPatterns = [
        'schedule_job' => ['book', 'schedule', 'appointment', 'next visit'],
        'create_quote' => ['quote', 'estimate', 'price for', 'cost for'],
        'create_invoice' => ['invoice', 'bill customer'],
        'record_payment' => ['record payment', 'paid', 'payment received'],
        'create_customer' => ['new customer', 'add customer', 'create customer'],
        'complete_job' => ['complete job', 'finish job', 'mark complete'],
        'report_damage' => ['report damage', 'damaged', 'broken'],
        'attendance_query' => ['attendance', 'days absent', 'days present', 'missed class'],
        'marks_query' => ['marks', 'grades', 'score', 'results', 'subject result'],
        'fees_query' => ['school fees', 'fee status', 'fees pending', 'tuition payment'],
        'homework_query' => ['homework', 'assignment', 'pending work', 'due work'],
        'timetable_query' => ['timetable', 'class schedule', 'classes tomorrow', 'classes today'],
        'performance_analysis' => ['academic performance', 'how am i doing', 'performance summary', 'gpa'],
        'study_plan' => ['study plan', 'exam preparation', 'prepare for exams', 'revision plan'],
        'progress_report' => ['progress report', 'parent report', 'report card', 'parent summary'],
    ];

    private NaiveBayesIntentClassifier $classifier;

    public function __construct(?NaiveBayesIntentClassifier $classifier = null)
    {
        $this->classifier = $classifier ?? NaiveBayesIntentClassifier::default();
    }

    public function understand(string $input): array
    {
        $normalized = strtolower(trim($input));
        $scores = [];
        foreach ($this->intentPatterns as $intent => $patterns) {
            $score = 0.0;
            foreach ($patterns as $pattern) {
                if (str_contains($normalized, $pattern)) {
                    $score = max($score, 0.72 + min(0.2, strlen($pattern) / 100));
                }
            }
            $scores[$intent] = $score;
        }
        arsort($scores);
        $ruleIntent = (string) array_key_first($scores);
        $ruleConfidence = (float) ($scores[$ruleIntent] ?? 0.0);
        $classification = $this->classifier->predict($input);

        if ($ruleConfidence > 0.0) {
            $intent = $ruleIntent;
            $confidence = max($ruleConfidence, (float) ($classification['intent'] === $ruleIntent ? $classification['confidence'] : 0.0));
            $source = 'rules+multinomial-naive-bayes';
        } else {
            $intent = (string) $classification['intent'];
            $confidence = (float) $classification['confidence'];
            $source = 'multinomial-naive-bayes';
        }

        if ($intent === 'unknown') {
            $confidence = min(0.49, max(0.2, $confidence));
        }

        $entities = $this->extractEntities($input);
        if ($entities !== []) {
            $confidence = min(0.99, $confidence + min(0.12, count($entities) * 0.03));
        }
        return [
            'intent' => $intent,
            'confidence' => round($confidence, 4),
            'entities' => $entities,
            'tokens' => preg_split('/\s+/', $normalized, -1, PREG_SPLIT_NO_EMPTY) ?: [],
            'classification_source' => $source,
            'alternatives' => $classification['alternatives'],
        ];
    }

    private function extractEntities(string $input): array
    {
        $entities = [];
        if (preg_match('/\b(?i:book|schedule|quote\s+for|invoice\s+for|customer)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)/', $input, $m)) {
            $entities['customer'] = $m[1];
        }
        $services = ['regular clean', 'carpet cleaning', 'end of lease cleaning', 'deep clean', 'commercial cleaning', 'window cleaning'];
        foreach ($services as $service) {
            if (stripos($input, $service) !== false) {
                $entities['service'] = $service;
                break;
            }
        }
        if (preg_match('/\b(next\s+(?:monday|tuesday|wednesday|thursday|friday|saturday|sunday)|today|tomorrow)\b/i', $input, $m)) {
            $entities['relative_date'] = strtolower($m[1]);
        }
        if (preg_match('/\b(morning|afternoon|evening|\d{1,2}(?::\d{2})?\s*(?:am|pm))\b/i', $input, $m)) {
            $entities['time'] = strtolower($m[1]);
        }
        if (preg_match('/\b(\d{1,5}\s+[A-Za-z][A-Za-z\s]+(?:Street|St|Road|Rd|Avenue|Ave|Lane|Ln|Drive|Dr))\b/i', $input, $m)) {
            $entities['address'] = trim($m[1]);
        }
        if (preg_match('/\$\s?(\d+(?:\.\d{1,2})?)/', $input, $m)) {
            $entities['amount'] = (float) $m[1];
        }
        if (preg_match('/\b(STU\d{2,})\b/i', $input, $m)) {
            $entities['student_id'] = strtoupper($m[1]);
        }
        $subjects = ['mathematics', 'maths', 'physics', 'chemistry', 'biology', 'english', 'history', 'geography'];
        foreach ($subjects as $subject) {
            if (stripos($input, $subject) !== false) {
                $entities['subject'] = $subject === 'maths' ? 'Mathematics' : ucfirst($subject);
                break;
            }
        }
        $months = ['january','february','march','april','may','june','july','august','september','october','november','december'];
        foreach ($months as $month) {
            if (stripos($input, $month) !== false) {
                $entities['month'] = ucfirst($month);
                break;
            }
        }
        if (preg_match('/\b(today|tomorrow|monday|tuesday|wednesday|thursday|friday|saturday|sunday)\b/i', $input, $m)) {
            $entities['day'] = ucfirst(strtolower($m[1]));
        }
        return $entities;
    }
}
