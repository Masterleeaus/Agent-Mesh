<?php

declare(strict_types=1);

namespace App\Extensions\TitanInterfaceRuntime\System\Http\Controllers;

use App\Extensions\TitanInterfaceRuntime\System\Contracts\Context\InterfaceContextStoreContract;
use App\Extensions\TitanInterfaceRuntime\System\Contracts\Experience\AttentionHudProjectorContract;
use App\Extensions\TitanInterfaceRuntime\System\Contracts\Experience\FocusWorkspacePolicyContract;
use App\Extensions\TitanInterfaceRuntime\System\Contracts\Experience\GuidanceOverlayProjectorContract;
use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

final class ExperienceShellController extends Controller
{
    public function __invoke(
        Request $request,
        InterfaceContextStoreContract $contexts,
        FocusWorkspacePolicyContract $focus,
        AttentionHudProjectorContract $hud,
        GuidanceOverlayProjectorContract $guidance,
    ): JsonResponse {
        $context=$contexts->requireCurrent();
        $targetKind=(string)$request->query('focus_kind','workspace');
        $targetReference=(string)$request->query('focus_ref',$context->workspaceId ?? $context->objectRef ?? 'interface-runtime');
        $limit=max(1,min(20,(int)$request->query('hud_limit',(int)config('titan-interface-runtime.experience.hud_limit',8))));
        $steps=(array)config('titan-interface-runtime.experience.guidance_steps',[]);

        return response()->json([
            'focus'=>$focus->project($context,$targetKind,$targetReference)->jsonSerialize(),
            'hud'=>$hud->project($context,$limit)->jsonSerialize(),
            'guidance'=>$guidance->project($context,$steps)->jsonSerialize(),
            'authority'=>'presentation-only',
        ]);
    }
}
