<?php

declare(strict_types=1);

namespace Tests\Feature;

use App\Extensions\TitanInterfaceRuntime\System\Contracts\Governance\GovernanceStateGatewayContract;
use App\Extensions\TitanInterfaceRuntime\System\Contracts\Governance\GovernanceWorkspaceContract;
use App\Extensions\TitanInterfaceRuntime\System\Contracts\Receipts\ReceiptPresenterContract;
use Tests\TestCase;

final class GovernanceWorkspaceBindingTest extends TestCase
{
    public function test_pass15_governance_workspace_is_bound(): void
    {
        self::assertInstanceOf(GovernanceStateGatewayContract::class,app(GovernanceStateGatewayContract::class));
        self::assertInstanceOf(GovernanceWorkspaceContract::class,app(GovernanceWorkspaceContract::class));
        self::assertInstanceOf(ReceiptPresenterContract::class,app(ReceiptPresenterContract::class));
    }
}
