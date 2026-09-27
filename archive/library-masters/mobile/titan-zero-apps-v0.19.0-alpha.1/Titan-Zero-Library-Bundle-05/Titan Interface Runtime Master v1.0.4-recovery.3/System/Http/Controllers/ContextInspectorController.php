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

final class ContextInspectorController extends Controller
{
    public function __invoke(
        string $objectReference,
        InterfaceContextStoreContract $contexts,
        ContextInspectorContract $inspector,
    ): JsonResponse {
        try {
            $reference=ObjectReference::parse($objectReference);
            return response()->json($inspector->inspect($reference,$contexts->requireCurrent())->jsonSerialize());
        } catch (ObjectReferenceResolutionException|ObjectWorkspaceCompositionException|\InvalidArgumentException) {
            return response()->json(['message'=>'Object inspector is unavailable.'],404);
        }
    }
}
