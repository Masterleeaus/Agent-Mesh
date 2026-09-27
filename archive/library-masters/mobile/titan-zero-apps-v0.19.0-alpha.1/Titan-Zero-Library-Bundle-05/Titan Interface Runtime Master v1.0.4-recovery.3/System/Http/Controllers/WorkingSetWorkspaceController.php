<?php

declare(strict_types=1);

namespace App\Extensions\TitanInterfaceRuntime\System\Http\Controllers;

use App\Extensions\TitanInterfaceRuntime\System\Contracts\Context\InterfaceContextStoreContract;
use App\Extensions\TitanInterfaceRuntime\System\Contracts\WorkingSet\WorkingSetWorkspaceContract;
use App\Extensions\TitanInterfaceRuntime\System\WorkingSet\WorkingSetWorkspaceException;
use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;

final class WorkingSetWorkspaceController extends Controller
{
    public function __invoke(string $workingSetId, InterfaceContextStoreContract $contexts, WorkingSetWorkspaceContract $workingSets): JsonResponse
    {
        try {
            return response()->json($workingSets->open($workingSetId,$contexts->requireCurrent())->jsonSerialize());
        } catch (WorkingSetWorkspaceException $e) {
            abort(404,$e->getMessage());
        }
    }
}
