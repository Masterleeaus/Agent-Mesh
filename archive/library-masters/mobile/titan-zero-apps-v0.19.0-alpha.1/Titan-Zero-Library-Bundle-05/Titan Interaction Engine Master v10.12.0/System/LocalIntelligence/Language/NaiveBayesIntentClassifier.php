<?php

declare(strict_types=1);

namespace App\Extensions\InteractionEngine\System\LocalIntelligence\Language;

/**
 * Dependency-free Multinomial Naive Bayes classifier for small, device-safe
 * intent models. The model is trained in memory from a reviewed corpus and
 * never deserializes executable objects (unlike Python pickle models).
 */
final class NaiveBayesIntentClassifier
{
    /** @var array<string, int> */
    private array $documentCounts = [];

    /** @var array<string, array<string, int>> */
    private array $tokenCounts = [];

    /** @var array<string, int> */
    private array $totalTokens = [];

    /** @var array<string, true> */
    private array $vocabulary = [];

    private int $documents = 0;

    /**
     * @param list<array{text: string, intent: string}> $examples
     */
    public function __construct(
        array $examples,
        private readonly float $alpha = 1.0,
        private readonly float $unknownThreshold = 0.26,
    ) {
        if ($examples === []) {
            throw new \InvalidArgumentException('At least one labelled intent example is required.');
        }
        if ($alpha <= 0.0) {
            throw new \InvalidArgumentException('Naive Bayes smoothing alpha must be greater than zero.');
        }
        $this->train($examples);
    }

    public static function default(): self
    {
        return new self(self::defaultCorpus());
    }

    /**
     * @return array{intent: string, confidence: float, alternatives: list<array{intent: string, confidence: float}>, model: string}
     */
    public function predict(string $text): array
    {
        $tokens = $this->tokenize($text);
        if ($tokens === []) {
            return ['intent' => 'unknown', 'confidence' => 1.0, 'alternatives' => [], 'model' => 'multinomial-naive-bayes-v1'];
        }

        $labels = array_keys($this->documentCounts);
        $vocabularySize = max(1, count($this->vocabulary));
        $logScores = [];

        foreach ($labels as $label) {
            $prior = ($this->documentCounts[$label] + $this->alpha)
                / ($this->documents + ($this->alpha * count($labels)));
            $score = log($prior);
            $denominator = $this->totalTokens[$label] + ($this->alpha * $vocabularySize);

            foreach ($tokens as $token) {
                $count = $this->tokenCounts[$label][$token] ?? 0;
                $score += log(($count + $this->alpha) / $denominator);
            }
            $logScores[$label] = $score;
        }

        $probabilities = $this->normalizeLogScores($logScores);
        arsort($probabilities);
        $intent = (string) array_key_first($probabilities);
        $confidence = (float) ($probabilities[$intent] ?? 0.0);

        if ($confidence < $this->unknownThreshold) {
            $intent = 'unknown';
        }

        $alternatives = [];
        foreach ($probabilities as $label => $probability) {
            if ($label === $intent) {
                continue;
            }
            $alternatives[] = ['intent' => $label, 'confidence' => round($probability, 4)];
            if (count($alternatives) === 3) {
                break;
            }
        }

        return [
            'intent' => $intent,
            'confidence' => round($confidence, 4),
            'alternatives' => $alternatives,
            'model' => 'multinomial-naive-bayes-v1',
        ];
    }

    /** @return list<string> */
    public function labels(): array
    {
        return array_keys($this->documentCounts);
    }

    public function estimatedModelBytes(): int
    {
        return strlen(json_encode([
            'documents' => $this->documentCounts,
            'tokens' => $this->tokenCounts,
            'totals' => $this->totalTokens,
        ], JSON_THROW_ON_ERROR));
    }

    /** @param list<array{text: string, intent: string}> $examples */
    private function train(array $examples): void
    {
        foreach ($examples as $example) {
            $text = trim((string) ($example['text'] ?? ''));
            $label = trim((string) ($example['intent'] ?? ''));
            if ($text === '' || $label === '') {
                throw new \InvalidArgumentException('Every intent example requires non-empty text and intent.');
            }

            $this->documents++;
            $this->documentCounts[$label] = ($this->documentCounts[$label] ?? 0) + 1;
            foreach ($this->tokenize($text) as $token) {
                $this->vocabulary[$token] = true;
                $this->tokenCounts[$label][$token] = ($this->tokenCounts[$label][$token] ?? 0) + 1;
                $this->totalTokens[$label] = ($this->totalTokens[$label] ?? 0) + 1;
            }
        }
    }

    /** @return list<string> */
    private function tokenize(string $text): array
    {
        $normalized = function_exists('mb_strtolower') ? mb_strtolower($text) : strtolower($text);
        $words = preg_split('/[^\p{L}\p{N}]+/u', $normalized, -1, PREG_SPLIT_NO_EMPTY) ?: [];
        $words = array_values(array_filter($words, static fn(string $word): bool => strlen($word) >= 2));
        $tokens = $words;
        for ($index = 0, $count = count($words) - 1; $index < $count; $index++) {
            $tokens[] = $words[$index] . '_' . $words[$index + 1];
        }
        return $tokens;
    }

    /** @param array<string, float> $scores @return array<string, float> */
    private function normalizeLogScores(array $scores): array
    {
        $maximum = max($scores);
        $exp = [];
        $sum = 0.0;
        foreach ($scores as $label => $score) {
            $value = exp($score - $maximum);
            $exp[$label] = $value;
            $sum += $value;
        }
        foreach ($exp as $label => $value) {
            $exp[$label] = $sum > 0.0 ? $value / $sum : 0.0;
        }
        return $exp;
    }

    /** @return list<array{text: string, intent: string}> */
    private static function defaultCorpus(): array
    {
        $groups = [
            'create_quote' => [
                'prepare a quote for the cleaning job', 'give the customer an estimate', 'price this service',
                'create a quote for carpet cleaning', 'how much will this job cost', 'send a quotation to the client',
            ],
            'schedule_job' => [
                'book the job for monday', 'schedule a service appointment', 'arrange the next visit',
                'put this cleaning job on the calendar', 'book a technician tomorrow', 'schedule the customer for friday',
            ],
            'create_invoice' => [
                'create an invoice for the completed job', 'bill the customer', 'send the final invoice',
                'invoice this service', 'prepare a bill for the client', 'generate the invoice now',
            ],
            'record_payment' => [
                'record the payment received', 'the customer has paid', 'mark this invoice paid',
                'payment came through', 'log the bank transfer', 'record cash payment',
            ],
            'create_customer' => [
                'add a new customer', 'create customer profile', 'register this client',
                'save a new contact as customer', 'onboard the customer', 'create an account for the client',
            ],
            'complete_job' => [
                'mark the job complete', 'finish this job', 'close the completed service',
                'the work is finished', 'complete the field job', 'record job completion',
            ],
            'report_damage' => [
                'report damage at the property', 'something was broken during the job', 'record a damaged item',
                'log property damage', 'create an incident for the broken window', 'report accidental damage',
            ],
            'attendance_query' => [
                'show my attendance for this month', 'how many classes did i miss', 'what is my attendance percentage',
                'list my absent days', 'attendance summary for student', 'have i missed any classes',
            ],
            'marks_query' => [
                'show my marks', 'what grade did i get in mathematics', 'list my exam results',
                'show subject scores', 'how did i score in physics', 'retrieve my marks record',
            ],
            'fees_query' => [
                'are my school fees paid', 'show pending school fees', 'what is my fee balance',
                'list tuition payments', 'fee status for this student', 'which months are unpaid',
            ],
            'homework_query' => [
                'show my pending homework', 'what assignments are due', 'list homework for this week',
                'do i have homework tomorrow', 'pending school assignments', 'what work is overdue',
            ],
            'timetable_query' => [
                'what classes do i have tomorrow', 'show my timetable for monday', 'class schedule today',
                'where is my next class', 'list the school timetable', 'what subjects are on friday',
            ],
            'performance_analysis' => [
                'summarise my academic performance', 'how am i doing at school', 'calculate my gpa',
                'show strengths and weak subjects', 'academic performance summary', 'analyse my results and attendance',
            ],
            'study_plan' => [
                'build a study plan for my exams', 'help me prepare for exams', 'make a revision schedule',
                'create a fifteen day study plan', 'what should i study first', 'exam preparation plan',
            ],
            'progress_report' => [
                'create a progress report for my parent', 'generate a parent report', 'prepare my report card summary',
                'show a complete student progress report', 'parent summary of school progress', 'combine marks attendance and homework',
            ],
            'reminder' => [
                'remind me to call the customer', 'do not let me forget the meeting', 'remember to buy supplies',
                'set a reminder for tomorrow', 'I need to take medicine at eight', 'remind me about the appointment',
            ],
            'emotional_support' => [
                'I feel overwhelmed and need someone to talk to', 'I am upset and struggling today',
                'this has been really difficult for me', 'I feel sad and need support',
                'I am anxious about what happened', 'please help me calm down',
            ],
            'action_item' => [
                'I will finish the task tomorrow', 'we should call the supplier', 'I need to send the email',
                'let us follow up on monday', 'I am going to start the project', 'we must inspect the site',
            ],
            'small_talk' => [
                'hello how are you', 'nice weather today', 'what is your favourite colour',
                'I am just relaxing at home', 'good morning', 'how has your day been',
            ],
            'unknown' => [
                'the sky is blue', '1234567890', 'lorem ipsum dolor sit amet',
                'maybe perhaps later', 'random unrelated words', 'a sentence without an operational request',
            ],
        ];

        $examples = [];
        foreach ($groups as $intent => $texts) {
            foreach ($texts as $text) {
                $examples[] = ['text' => $text, 'intent' => $intent];
            }
        }
        return $examples;
    }
}
