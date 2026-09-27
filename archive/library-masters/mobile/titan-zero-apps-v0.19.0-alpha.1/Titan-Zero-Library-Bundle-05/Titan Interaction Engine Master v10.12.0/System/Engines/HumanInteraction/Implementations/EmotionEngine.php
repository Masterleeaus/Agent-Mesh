<?php

declare(strict_types=1);

namespace App\Extensions\InteractionEngine\System\Engines\HumanInteraction\Implementations;

use App\Extensions\InteractionEngine\System\Engines\HumanInteraction\Contracts\EmotionEngineInterface;

/**
 * Lexicon-based emotion scoring across a fixed emotion set — same
 * technique as HumanInteraction's SentimentEngine, applied to more
 * categories. Fixed during the fix pass: detect() always returned the
 * identical neutral=0.7/happy=0.2/sad=0.1 distribution regardless of
 * $input.
 */
class EmotionEngine implements EmotionEngineInterface
{
    private const LEXICON = [
        'happy' => ['happy', 'great', 'excited', 'love', 'wonderful', 'thanks', 'awesome'],
        'sad' => ['sad', 'unhappy', 'disappointed', 'sorry', 'unfortunately'],
        'angry' => ['angry', 'furious', 'frustrated', 'unacceptable', 'ridiculous'],
        'surprised' => ['wow', 'really', 'unexpected', 'surprised', 'shocking'],
    ];

    private string $lastDetected = 'neutral';

    public function detect(string $input): array
    {
        $words = preg_split('/\W+/', strtolower($input), -1, PREG_SPLIT_NO_EMPTY) ?: [];

        $scores = [];
        foreach (self::LEXICON as $emotion => $keywords) {
            $scores[$emotion] = count(array_intersect($words, $keywords));
        }

        $total = array_sum($scores) ?: 1;
        $distribution = [];
        foreach ($scores as $emotion => $count) {
            $distribution[$emotion] = round($count / max($total, count(self::LEXICON)), 2);
        }

        // Whatever's left over (no matches) is neutral
        $distribution['neutral'] = round(max(0, 1 - array_sum($distribution)), 2);

        arsort($distribution);
        $this->lastDetected = array_key_first($distribution);

        return $distribution;
    }

    public function getCurrentEmotion(): string
    {
        return $this->lastDetected;
    }

    public function listEmotions(): array
    {
        return array_merge(array_keys(self::LEXICON), ['neutral']);
    }
}
