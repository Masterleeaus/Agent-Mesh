<?php

declare(strict_types=1);

namespace Tests\Feature;

use App\Extensions\TitanInterfaceRuntime\System\Contracts\Experience\AttentionHudProjectorContract;
use App\Extensions\TitanInterfaceRuntime\System\Contracts\Experience\FocusWorkspacePolicyContract;
use App\Extensions\TitanInterfaceRuntime\System\Contracts\Experience\GuidanceOverlayProjectorContract;
use Tests\TestCase;

final class ExperienceShellBindingTest extends TestCase
{
    public function test_pass20_experience_services_are_bound(): void
    {
        self::assertInstanceOf(FocusWorkspacePolicyContract::class,app(FocusWorkspacePolicyContract::class));
        self::assertInstanceOf(AttentionHudProjectorContract::class,app(AttentionHudProjectorContract::class));
        self::assertInstanceOf(GuidanceOverlayProjectorContract::class,app(GuidanceOverlayProjectorContract::class));
    }
}
