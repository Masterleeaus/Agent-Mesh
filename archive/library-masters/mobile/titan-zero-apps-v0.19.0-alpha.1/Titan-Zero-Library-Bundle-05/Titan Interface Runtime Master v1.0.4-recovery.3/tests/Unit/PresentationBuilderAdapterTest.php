<?php

declare(strict_types=1);

namespace Tests\Unit;

use App\Extensions\TitanInterfaceRuntime\System\Presentation\ArrayComponentVocabulary;
use App\Extensions\TitanInterfaceRuntime\System\Presentation\BuilderPresentationAdapter;
use App\Extensions\TitanInterfaceRuntime\System\Presentation\PresentationComponentPolicy;
use App\Extensions\TitanInterfaceRuntime\System\Presentation\PresentationNode;
use App\Extensions\TitanInterfaceRuntime\System\Presentation\PresentationTree;
use App\Extensions\TitanInterfaceRuntime\System\Presentation\ResponsiveHints;
use PHPUnit\Framework\TestCase;

final class PresentationBuilderAdapterTest extends TestCase
{
    public function test_known_builder_component_is_resolved_without_granting_builder_authority(): void
    {
        $adapter = $this->adapter([
            'entity-card' => $this->component('entity-card'),
            'stack' => $this->component('stack'),
        ]);

        $resolved = $adapter->resolve('entity-card', 'card', ResponsiveHints::auto());

        self::assertSame('entity-card', $resolved->componentId);
        self::assertFalse($resolved->fallback);
        self::assertSame('presentation-only', $resolved->authority);
        self::assertSame([], $resolved->actions);
    }

    public function test_unknown_or_unsafe_component_falls_back_deterministically(): void
    {
        $adapter = $this->adapter([
            'stack' => $this->component('stack'),
            'unsafe' => $this->component('unsafe', authority: 'business-write'),
        ]);

        self::assertSame('stack', $adapter->resolve('does-not-exist', 'panel', ResponsiveHints::auto())->componentId);
        $unsafe = $adapter->resolve('unsafe', 'panel', ResponsiveHints::auto());
        self::assertSame('stack', $unsafe->componentId);
        self::assertTrue($unsafe->fallback);
    }

    public function test_responsive_requirement_rejects_non_responsive_component(): void
    {
        $adapter = $this->adapter([
            'entity-card' => $this->component('entity-card', responsive: false),
            'stack' => $this->component('stack'),
        ]);

        $resolved = $adapter->resolve('entity-card', 'card', ResponsiveHints::required());
        self::assertSame('stack', $resolved->componentId);
        self::assertTrue($resolved->fallback);
    }

    public function test_presentation_tree_serialization_is_deterministic(): void
    {
        $left = new PresentationTree(
            surface: 'command',
            root: new PresentationNode('stack', 'root', ['z' => 1, 'a' => ['y' => 2, 'x' => 1]], [
                new PresentationNode('entity-card', 'customer', ['title' => 'Sarah']),
            ]),
            responsive: new ResponsiveHints('auto', ['md' => 768, 'sm' => 576]),
            meta: ['z' => 2, 'a' => 1],
        );
        $right = new PresentationTree(
            surface: 'command',
            root: new PresentationNode('stack', 'root', ['a' => ['x' => 1, 'y' => 2], 'z' => 1], [
                new PresentationNode('entity-card', 'customer', ['title' => 'Sarah']),
            ]),
            responsive: new ResponsiveHints('auto', ['sm' => 576, 'md' => 768]),
            meta: ['a' => 1, 'z' => 2],
        );

        self::assertSame($left->toCanonicalJson(), $right->toCanonicalJson());
        self::assertSame($left->fingerprint(), $right->fingerprint());
    }

    /** @param array<string,array<string,mixed>> $components */
    private function adapter(array $components): BuilderPresentationAdapter
    {
        return new BuilderPresentationAdapter(new ArrayComponentVocabulary($components), new PresentationComponentPolicy());
    }

    /** @return array<string,mixed> */
    private function component(string $id, string $authority = 'presentation-only', bool $responsive = true): array
    {
        return [
            'id' => $id,
            'authority' => $authority,
            'responsive' => $responsive,
            'accessible' => true,
            'actions' => ['domain.write'],
        ];
    }
}
