<?php

declare(strict_types=1);

namespace Tests\Unit;

use App\Extensions\TitanInterfaceRuntime\System\Context\InterfaceContext;
use App\Extensions\TitanInterfaceRuntime\System\Objects\ObjectReference;
use App\Extensions\TitanInterfaceRuntime\System\Objects\ObjectReferenceResolutionException;
use App\Extensions\TitanInterfaceRuntime\System\Registry\InMemoryObjectRegistry;
use PHPUnit\Framework\TestCase;

final class ObjectRelationshipRegistryTest extends TestCase
{
    public function test_cross_extension_relationships_and_tenant_bound_references_are_safe(): void
    {
        $registry = new InMemoryObjectRegistry();
        $snapshot = $registry->rebuild([
            'titan-crm' => ['objects' => [$this->object('crm.customer', ['command', 'hub'], ['field.job'], true)]],
            'titan-field' => ['objects' => [$this->object('field.job', ['command', 'go'], ['crm.customer'])]],
        ]);

        self::assertSame(['crm.customer', 'field.job'], array_keys($snapshot->objects));
        self::assertArrayHasKey('crm.customer->field.job', $snapshot->relationships);

        $context = new InterfaceContext(7, 11, 'command', 'customers');
        self::assertSame('crm.customer', $registry->resolve(ObjectReference::parse('crm.customer@7:CUST-1'), $context)->object->key);

        $this->expectException(ObjectReferenceResolutionException::class);
        $registry->resolve(ObjectReference::parse('crm.customer@8:CUST-1'), $context);
    }

    public function test_collisions_and_unknown_relationships_fail_closed(): void
    {
        $collisionRegistry = new InMemoryObjectRegistry();
        $collision = $collisionRegistry->rebuild([
            'alpha' => ['objects' => [$this->object('shared.object', ['command'])]],
            'beta' => ['objects' => [$this->object('shared.object', ['command'])]],
        ]);
        self::assertArrayHasKey('shared.object', $collision->collisions);
        self::assertArrayNotHasKey('shared.object', $collision->objects);

        $unknownRegistry = new InMemoryObjectRegistry();
        $unknown = $unknownRegistry->rebuild([
            'bad' => ['objects' => [$this->object('bad.object', ['command'], ['missing.object'])]],
        ]);
        self::assertArrayHasKey('bad', $unknown->rejected);
        self::assertSame([], $unknown->objects);
    }

    /** @return array<string,mixed> */
    private function object(string $key, array $surfaces, array $relationships = [], bool $customerSafe = false): array
    {
        return [
            'key' => $key,
            'label' => $key,
            'data_authority' => 'test',
            'scope' => ['type' => 'tenant', 'tenant_key' => 'company_id'],
            'product_surfaces' => $surfaces,
            'customer_safe' => $customerSafe,
            'permissions' => [],
            'lifecycle_ref' => null,
            'facet_refs' => [],
            'view_refs' => [],
            'action_refs' => [],
            'relationship_refs' => $relationships,
            'offline_mode' => 'read-only',
        ];
    }
}
