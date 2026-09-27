<?php

declare(strict_types=1);

namespace App\Extensions\TitanInterfaceRuntime\System\Presentation;

use App\Extensions\TitanInterfaceRuntime\System\Contracts\Presentation\ComponentVocabularyContract;

final readonly class BuilderPresentationAdapter
{
    private const FALLBACK_BY_CONTAINER = [
        'chat' => 'chat-thread',
        'card' => 'entity-card',
        'panel' => 'stack',
        'drawer' => 'drawer',
        'wizard' => 'form-wizard',
        'board' => 'kanban-board',
        'map' => 'stack',
        'calendar' => 'data-list',
        'timeline' => 'timeline',
        'table' => 'table',
        'canvas' => 'stack',
        'report' => 'report-shell',
        'modal' => 'modal',
        'full-workspace' => 'stack',
    ];
    private const SAFE_FALLBACKS = ['stack', 'entity-card', 'text', 'empty-state'];

    public function __construct(
        private ComponentVocabularyContract $vocabulary,
        private PresentationComponentPolicy $policy,
    ) {}

    public function resolve(?string $hint, string $container, ResponsiveHints $responsive): ResolvedPresentationComponent
    {
        if (! isset(self::FALLBACK_BY_CONTAINER[$container])) throw new \InvalidArgumentException("Unsupported presentation container '{$container}'.");
        $requested = is_string($hint) && $hint !== '' ? $hint : null;
        $candidates = [];
        if ($requested !== null) $candidates[] = $requested;
        $candidates[] = self::FALLBACK_BY_CONTAINER[$container];
        foreach (self::SAFE_FALLBACKS as $fallback) $candidates[] = $fallback;
        $candidates = array_values(array_unique($candidates));

        foreach ($candidates as $candidate) {
            $definition = $this->vocabulary->find($candidate);
            if ($definition === null || ! $this->policy->accepts($definition, $responsive)) continue;
            return $this->resolved($requested, $candidate, $definition, $candidate !== $requested, $candidate === $requested ? 'requested-component-approved' : 'safe-fallback');
        }

        return new ResolvedPresentationComponent(
            requestedHint: $requested,
            componentId: 'safe-container',
            source: 'titan-interface-runtime',
            authority: 'presentation-only',
            responsive: true,
            accessible: true,
            fallback: true,
            reason: 'builder-unavailable-or-no-policy-safe-component',
            props: [],
            actions: [],
        );
    }

    /** @param array<string,mixed> $definition */
    private function resolved(?string $requested, string $id, array $definition, bool $fallback, string $reason): ResolvedPresentationComponent
    {
        $props = [];
        if (is_array($definition['props'] ?? null)) {
            $props = array_values(array_filter($definition['props'], 'is_string'));
            sort($props, SORT_STRING);
        }
        return new ResolvedPresentationComponent(
            requestedHint: $requested,
            componentId: $id,
            source: $this->vocabulary->source(),
            authority: 'presentation-only',
            responsive: ($definition['responsive'] ?? false) === true,
            accessible: ($definition['accessible'] ?? false) === true,
            fallback: $fallback,
            reason: $reason,
            props: $props,
            actions: [],
        );
    }
}
