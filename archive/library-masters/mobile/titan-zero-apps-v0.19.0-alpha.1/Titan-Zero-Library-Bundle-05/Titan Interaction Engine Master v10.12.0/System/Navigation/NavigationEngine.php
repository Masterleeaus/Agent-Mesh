<?php

declare(strict_types=1);

namespace App\Extensions\InteractionEngine\System\Navigation;

use App\Extensions\InteractionEngine\System\Contracts\NavigationEngineInterface;
use App\Extensions\InteractionEngine\System\DTO\InteractionDefinition;
use App\Extensions\InteractionEngine\System\Compiler\ConditionRegistry;

class NavigationEngine implements NavigationEngineInterface
{
    private ConditionRegistry $conditionRegistry;

    public function __construct(ConditionRegistry $conditionRegistry)
    {
        $this->conditionRegistry = $conditionRegistry;
    }

    public function getNextSectionIndex(array $state, InteractionDefinition $definition): ?int
    {
        $current = $state['current_section_index'];
        $sections = $definition->sections;
        $next = $current + 1;

        while ($next < count($sections)) {
            $section = $sections[$next];
            if ($this->shouldSkipSection($section, $state)) {
                $next++;
                continue;
            }
            // Check if all questions in this section are already answered
            $allAnswered = true;
            foreach ($section->questions as $question) {
                if (!$this->isAnswered($state, $question->key)) {
                    $allAnswered = false;
                    break;
                }
            }
            if ($allAnswered && $next < count($sections) - 1) {
                $next++;
                continue;
            }
            break;
        }

        if ($next >= count($sections)) {
            return null;
        }
        return $next;
    }

    public function getPreviousSectionIndex(array $state, InteractionDefinition $definition): ?int
    {
        $current = $state['current_section_index'];
        $prev = $current - 1;
        if ($prev < 0) {
            return null;
        }
        while ($prev >= 0) {
            $section = $definition->sections[$prev];
            if ($this->shouldSkipSection($section, $state)) {
                $prev--;
                continue;
            }
            break;
        }
        return $prev >= 0 ? $prev : null;
    }

    private function shouldSkipSection($section, array $state): bool
    {
        if (isset($section->metadata['condition'])) {
            $conditionName = $section->metadata['condition'];
            return !$this->conditionRegistry->evaluate($conditionName, $state);
        }
        return false;
    }

    private function isAnswered(array $state, string $key): bool
    {
        foreach ($state['answers'] ?? [] as $answer) {
            if ($answer->questionKey === $key) {
                return $answer->value !== null;
            }
        }
        return false;
    }
}
