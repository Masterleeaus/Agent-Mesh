<?php

declare(strict_types=1);

namespace Tests\Unit\Extensions\TitanInterfaceRuntime;

use App\Extensions\TitanInterfaceRuntime\System\Context\InterfaceContext;
use App\Extensions\TitanInterfaceRuntime\System\Experience\DonorRationalizationCatalog;
use App\Extensions\TitanInterfaceRuntime\System\Experience\FocusWorkspacePolicy;
use App\Extensions\TitanInterfaceRuntime\System\Experience\GuidanceOverlayProjector;
use PHPUnit\Framework\TestCase;

final class ExperienceDonorRationalizationTest extends TestCase
{
    public function test_focus_and_guidance_remain_presentation_only(): void
    {
        $context=new InterfaceContext(7,11,'command','crm',workspaceId:'workspace-1');
        $focus=(new FocusWorkspacePolicy())->project($context,'workspace','workspace-1');
        self::assertTrue($focus->preserveGlobalSafetyControls);
        self::assertTrue($focus->preserveAttentionHud);

        $guidance=(new GuidanceOverlayProjector())->project($context,[
            ['key'=>'open-customer','title'=>'Customer','description'=>'Open the customer workspace.','target_ref'=>'nav.crm.customer','placement'=>'bottom','action_ref'=>'crm.customer.open'],
        ]);
        self::assertFalse($guidance->steps[0]['executable']);
        self::assertFalse($guidance->jsonSerialize()['workflow_authority']);
    }

    public function test_donor_catalog_never_claims_wizard_or_announcement_data_authority(): void
    {
        $catalog=(new DonorRationalizationCatalog())->all();
        self::assertFalse($catalog['onboarding-pro']['wizard_authority']);
        self::assertSame('source-extension',$catalog['announcement']['data_authority']);
        self::assertSame('retire',$catalog['introductions']['decision']);
    }
}
