<?php

declare(strict_types=1);

namespace Tests\Unit;

use App\Extensions\TitanInterfaceRuntime\System\Context\InterfaceContext;
use App\Extensions\TitanInterfaceRuntime\System\Objects\ObjectReference;
use App\Extensions\TitanInterfaceRuntime\System\Registry\InMemoryFacetRegistry;
use App\Extensions\TitanInterfaceRuntime\System\Registry\InMemoryObjectRegistry;
use App\Extensions\TitanInterfaceRuntime\System\Workspace\ObjectWorkspaceComposer;
use PHPUnit\Framework\TestCase;

final class FacetObjectWorkspaceTest extends TestCase
{
    public function test_cross_extension_facets_are_composed_lazily_and_filtered_by_permission(): void
    {
        $objects = new InMemoryObjectRegistry();
        $objects->rebuild(['crm' => ['objects' => [$this->object('crm.customer')]]]);
        $facets = new InMemoryFacetRegistry($objects);
        $facets->rebuild([
            'crm' => ['facets' => [$this->facet('crm.summary', 'summary', ['command', 'hub'], true, ['crm.view'])]],
            'connect' => ['facets' => [$this->facet('connect.messages', 'messages', ['command', 'hub'], true, ['messages.view'])]],
            'ai' => ['facets' => [$this->facet('ai.recommendations', 'recommendations', ['command'], false, ['ai.view'])]],
        ]);

        $context = new InterfaceContext(7, 11, 'command', 'customers', capabilities: ['crm.view', 'messages.view']);
        $workspace = (new ObjectWorkspaceComposer($objects, $facets))->compose(ObjectReference::parse('crm.customer@7:C1'), $context);

        self::assertSame(['crm.summary', 'connect.messages'], array_map(static fn ($slot) => $slot->facet->key, $workspace->facets));
        self::assertSame(['lazy', 'lazy'], array_map(static fn ($slot) => $slot->loading, $workspace->facets));
    }

    private function object(string $key): array
    {
        return ['key'=>$key,'label'=>'Customer','data_authority'=>'crm','scope'=>['type'=>'tenant','tenant_key'=>'company_id'],'product_surfaces'=>['command','hub'],'customer_safe'=>true,'permissions'=>[],'lifecycle_ref'=>null,'facet_refs'=>[],'view_refs'=>[],'action_refs'=>[],'relationship_refs'=>[],'offline_mode'=>'read-only'];
    }

    private function facet(string $key, string $kind, array $surfaces, bool $safe, array $permissions): array
    {
        return ['key'=>$key,'label'=>$key,'kind'=>$kind,'applies_to'=>['crm.customer'],'container'=>'panel','product_surfaces'=>$surfaces,'customer_safe'=>$safe,'permissions'=>$permissions,'renderer_hint'=>null];
    }
}
