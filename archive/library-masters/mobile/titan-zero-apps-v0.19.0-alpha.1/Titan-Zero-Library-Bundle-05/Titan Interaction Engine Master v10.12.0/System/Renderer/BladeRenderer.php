<?php

declare(strict_types=1);

namespace App\Extensions\InteractionEngine\System\Renderer;

use Illuminate\Support\Facades\View;
use App\Extensions\InteractionEngine\System\Contracts\RendererInterface;
use App\Extensions\InteractionEngine\System\DTO\InteractionDefinition;
use App\Extensions\InteractionEngine\System\DTO\Section;

class BladeRenderer implements RendererInterface
{
    public function __construct(private readonly string $view = 'interaction::run') {}

    public function render(InteractionDefinition $definition, array $state, array $options = []): string
    {
        return View::make($this->view, array_merge([
            'definition' => $definition,
            'state' => $state,
            'currentSection' => $this->getCurrentSection($definition, $state),
            'answers' => $state['answers'] ?? [],
        ], $options))->render();
    }

    private function getCurrentSection(InteractionDefinition $definition, array $state): ?Section
    {
        $index = (int) ($state['current_section_index'] ?? 0);
        return $definition->sections[$index] ?? null;
    }
}
