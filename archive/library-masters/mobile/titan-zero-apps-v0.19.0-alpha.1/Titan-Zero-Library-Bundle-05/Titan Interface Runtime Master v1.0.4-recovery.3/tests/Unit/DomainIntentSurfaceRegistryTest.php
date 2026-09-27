<?php

declare(strict_types=1);

namespace Tests\Unit\Extensions\TitanInterfaceRuntime;

use App\Extensions\TitanInterfaceRuntime\System\Navigation\RegistryNavigationProjector;
use App\Extensions\TitanInterfaceRuntime\System\Registry\InMemoryDomainRegistry;
use App\Extensions\TitanInterfaceRuntime\System\Surfaces\IntentSurfaceCatalog;
use PHPUnit\Framework\TestCase;

final class DomainIntentSurfaceRegistryTest extends TestCase
{
    public function test_domains_are_ordered_and_intents_are_canonical(): void
    {
        $registry = new InMemoryDomainRegistry();
        $snapshot = $registry->rebuild([
            'crm' => ['domains' => [[
                'key' => 'customers', 'label' => 'Customers', 'layer' => 'business',
                'product_surfaces' => ['command', 'hub'],
                'intent_surfaces' => ['data', 'home', 'ask', 'work', 'do', 'decide', 'explore', 'insights'],
                'object_refs' => [], 'default_view_refs' => [], 'priority' => 20,
            ]]],
            'field' => ['domains' => [[
                'key' => 'work', 'label' => 'Work', 'layer' => 'business',
                'product_surfaces' => ['command', 'go'],
                'intent_surfaces' => ['data', 'work', 'home'],
                'object_refs' => [], 'default_view_refs' => [], 'priority' => 10,
            ]]],
        ]);

        self::assertSame(['work', 'customers'], array_keys($snapshot->domains));
        self::assertSame(IntentSurfaceCatalog::keys(), $snapshot->domains['customers']->intentSurfaces);
        self::assertSame(['customers'], array_keys($registry->visibleFor('hub')));
    }

    public function test_duplicate_domain_ownership_fails_closed(): void
    {
        $registry = new InMemoryDomainRegistry();
        $snapshot = $registry->rebuild([
            'alpha' => ['domains' => [$this->domain('shared')]],
            'beta' => ['domains' => [$this->domain('shared')]],
        ]);

        self::assertArrayHasKey('shared', $snapshot->collisions);
        self::assertArrayNotHasKey('shared', $snapshot->domains);
    }

    public function test_navigation_projection_filters_by_product_surface(): void
    {
        $registry = new InMemoryDomainRegistry();
        $registry->rebuild([
            'crm' => ['domains' => [[...$this->domain('customers'), 'product_surfaces' => ['command', 'hub']]]],
            'field' => ['domains' => [[...$this->domain('work'), 'product_surfaces' => ['command', 'go']]]],
        ]);

        $projection = (new RegistryNavigationProjector($registry))->project('hub', 'customers', 'home');
        self::assertCount(1, $projection->items);
        self::assertSame('customers', $projection->items[0]['key']);
        self::assertTrue($projection->items[0]['active']);
    }

    /** @return array<string,mixed> */
    private function domain(string $key): array
    {
        return [
            'key' => $key,
            'label' => ucfirst($key),
            'layer' => 'business',
            'product_surfaces' => ['command'],
            'intent_surfaces' => ['home'],
            'object_refs' => [],
            'default_view_refs' => [],
            'priority' => 10,
        ];
    }
}
