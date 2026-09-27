<?php

declare(strict_types=1);

namespace Tests\Unit\Extensions\TitanInterfaceRuntime;

use App\Extensions\TitanInterfaceRuntime\System\Authority\AuthorityReadResult;
use App\Extensions\TitanInterfaceRuntime\System\Context\InterfaceContext;
use App\Extensions\TitanInterfaceRuntime\System\Presentation\PresentationNode;
use App\Extensions\TitanInterfaceRuntime\System\Receipts\InterfaceReceipt;
use PHPUnit\Framework\TestCase;

final class RuntimeValueObjectsTest extends TestCase
{
    public function test_context_serializes_canonical_spine_fields(): void
    {
        $context = new InterfaceContext(
            companyId: 7,
            userId: 42,
            productSurface: 'command',
            domain: 'work',
            objectRef: 'crm.work-order:123',
            roles: ['manager'],
            capabilities: ['crm.work.read'],
        );

        self::assertSame(7, $context->jsonSerialize()['company_id']);
        self::assertSame('crm.work-order:123', $context->jsonSerialize()['object_ref']);
    }

    public function test_presentation_tree_serializes_deterministically(): void
    {
        $node = new PresentationNode(
            type: 'panel',
            key: 'work.summary',
            props: ['title' => 'Work'],
            children: [new PresentationNode('card', 'work.metric')],
        );

        self::assertSame('work.metric', $node->jsonSerialize()['children'][0]['key']);
    }

    public function test_authority_result_keeps_provenance_separate_from_data(): void
    {
        $result = new AuthorityReadResult(
            authority: 'crm',
            reference: 'crm.work-orders',
            data: [['id' => 1]],
            provenance: ['source' => 'read-model'],
        );

        self::assertSame('crm', $result->jsonSerialize()['authority']);
        self::assertSame('read-model', $result->jsonSerialize()['provenance']['source']);
    }

    public function test_receipt_exposes_rollback_without_executing_it(): void
    {
        $receipt = new InterfaceReceipt(
            receiptId: 'receipt-1',
            status: 'COMPLETED',
            sourceAuthority: 'command-bus',
            rollbackCapability: 'crm.work-order.rollback',
        );

        self::assertTrue($receipt->isReversible());
        self::assertSame('crm.work-order.rollback', $receipt->jsonSerialize()['rollback_capability']);
    }
}
