<?php

declare(strict_types=1);

namespace App\Extensions\TitanInterfaceRuntime\System\Http\Controllers;

use App\Extensions\TitanInterfaceRuntime\System\Contracts\Context\InterfaceContextStoreContract;
use App\Extensions\TitanInterfaceRuntime\System\Contracts\Inspector\ContextInspectorContract;
use App\Extensions\TitanInterfaceRuntime\System\Objects\ObjectReference;
use App\Extensions\TitanInterfaceRuntime\System\Objects\ObjectReferenceResolutionException;
use App\Extensions\TitanInterfaceRuntime\System\Workspace\ObjectWorkspaceCompositionException;
use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;

final class ObjectWorkspaceController extends Controller
{
    public function __invoke(
        string $objectReference,
        InterfaceContextStoreContract $contexts,
        ContextInspectorContract $inspector,
    ): JsonResponse {
        try {
            $snapshot=$inspector->inspect(ObjectReference::parse($objectReference),$contexts->requireCurrent());
            return response()->json([
                'authority'=>'presentation-only',
                'context'=>$snapshot->context->jsonSerialize(),
                'workspace'=>$snapshot->workspace->jsonSerialize(),
                'actions'=>array_map(static fn($action)=>$action->jsonSerialize(),$snapshot->actions),
            ]);
        } catch (ObjectReferenceResolutionException|ObjectWorkspaceCompositionException|\InvalidArgumentException) {
            return response()->json(['message'=>'Object workspace is unavailable.'],404);
        }
    }
}
