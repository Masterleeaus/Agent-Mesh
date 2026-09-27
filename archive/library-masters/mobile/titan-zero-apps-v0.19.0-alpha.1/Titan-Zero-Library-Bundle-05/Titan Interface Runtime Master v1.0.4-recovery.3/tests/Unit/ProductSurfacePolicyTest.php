<?php

declare(strict_types=1);

namespace Tests\Unit\Extensions\TitanInterfaceRuntime;

use App\Extensions\TitanInterfaceRuntime\System\Context\InterfaceContext;
use App\Extensions\TitanInterfaceRuntime\System\ProductSurface\ProductSurfacePolicy;
use App\Extensions\TitanInterfaceRuntime\System\Registry\ActionDescriptor;
use App\Extensions\TitanInterfaceRuntime\System\Registry\FacetDescriptor;
use App\Extensions\TitanInterfaceRuntime\System\Registry\ObjectDescriptor;
use App\Extensions\TitanInterfaceRuntime\System\Registry\ViewDescriptor;
use PHPUnit\Framework\TestCase;

final class ProductSurfacePolicyTest extends TestCase
{
    public function test_surface_matrix_prevents_cross_audience_leakage_and_exposes_presentation_policy(): void
    {
        $policy = new ProductSurfacePolicy();

        $command = new InterfaceContext(7, 11, 'command', 'crm', roles: ['owner'], capabilities: ['crm.customer.view', 'crm.customer.manage']);
        $go = new InterfaceContext(7, 22, 'go', 'work', roles: ['worker'], capabilities: ['crm.customer.view', 'jobs.work.execute']);
        $hub = new InterfaceContext(7, 33, 'hub', 'crm', roles: ['customer'], capabilities: ['crm.customer.view', 'portal.customer.update']);
        $onboarding = new InterfaceContext(7, 44, 'onboarding', 'setup', roles: ['manager'], capabilities: ['crm.customer.view']);

        $customer = new ObjectDescriptor(
            'crm', 'crm.customer', 'Customer', 'crm', 'tenant', 'company_id',
            ['command', 'go', 'hub', 'onboarding'], true, ['crm.customer.view'], null, [], [], [], [], 'read-only'
        );
        $ownerLedger = new ViewDescriptor(
            'crm', 'crm.customer.owner-ledger', 'Owner Ledger', 'table', ['crm.customer'], ['command'], false,
            ['crm.customer.manage'], 'crm', 'read-model', 'customer.owner-ledger', 'table'
        );
        $customerSummary = new ViewDescriptor(
            'crm', 'crm.customer.summary', 'Customer Summary', 'cards', ['crm.customer'], ['command', 'hub'], true,
            ['crm.customer.view'], 'crm', 'read-model', 'customer.summary', 'entity-card'
        );
        $workerFacet = new FacetDescriptor(
            'field', 'jobs.worker-status', 'Worker Status', 'activity', ['crm.customer'], 'panel', ['go'], false,
            ['jobs.work.execute'], 'worker-status'
        );
        $hubFacet = new FacetDescriptor(
            'crm', 'crm.customer.portal-summary', 'Portal Summary', 'summary', ['crm.customer'], 'card', ['hub'], true,
            ['crm.customer.view'], 'entity-card'
        );
        $ownerAction = new ActionDescriptor(
            'crm', 'crm.customer.write-off', 'Write off debt', ['crm.customer'], true, 'finance.debt.write-off', null,
            ['command'], ['crm.customer.manage'], 'online-required', true, 'modal', false
        );
        $workerAction = new ActionDescriptor(
            'field', 'jobs.customer.arrive', 'Mark arrival', ['crm.customer'], true, 'jobs.work.arrive', null,
            ['go'], ['jobs.work.execute'], 'queueable', true, 'card', false
        );
        $hubAction = new ActionDescriptor(
            'crm', 'crm.customer.update-contact', 'Update contact details', ['crm.customer'], true, 'portal.customer.update', null,
            ['hub'], ['portal.customer.update'], 'online-required', true, 'wizard', true
        );

        self::assertTrue($policy->allowsObject($customer, $command));
        self::assertTrue($policy->allowsObject($customer, $go));
        self::assertTrue($policy->allowsObject($customer, $hub));
        self::assertTrue($policy->allowsObject($customer, $onboarding));

        self::assertTrue($policy->allowsView($ownerLedger, $command));
        self::assertFalse($policy->allowsView($ownerLedger, $hub));
        self::assertTrue($policy->allowsView($customerSummary, $hub));

        self::assertTrue($policy->allowsFacet($workerFacet, $go));
        self::assertFalse($policy->allowsFacet($workerFacet, $command));
        self::assertFalse($policy->allowsFacet($workerFacet, $hub));
        self::assertTrue($policy->allowsFacet($hubFacet, $hub));

        self::assertTrue($policy->allowsAction($ownerAction, $command));
        self::assertFalse($policy->allowsAction($ownerAction, $go));
        self::assertFalse($policy->allowsAction($ownerAction, $hub));
        self::assertTrue($policy->allowsAction($workerAction, $go));
        self::assertFalse($policy->allowsAction($workerAction, $command));
        self::assertTrue($policy->allowsAction($hubAction, $hub));
        self::assertFalse($policy->allowsAction($hubAction, $command));

        self::assertSame('owner-manager', $policy->profile($command)->audience);
        self::assertFalse($policy->profile($command)->mobileFirst);
        self::assertTrue($policy->profile($go)->mobileFirst);
        self::assertSame('compact', $policy->profile($go)->density);
        self::assertTrue($policy->profile($hub)->customerSafeRequired);
        self::assertSame('simple', $policy->profile($hub)->density);
        self::assertTrue($policy->profile($onboarding)->progressiveDisclosure);
        self::assertSame('stepwise', $policy->profile($onboarding)->navigationMode);
    }
}
