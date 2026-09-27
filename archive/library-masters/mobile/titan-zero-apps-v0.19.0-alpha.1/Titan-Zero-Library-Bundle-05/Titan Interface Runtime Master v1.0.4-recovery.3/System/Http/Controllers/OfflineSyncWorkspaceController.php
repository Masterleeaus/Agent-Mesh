<?php

declare(strict_types=1);
namespace App\Extensions\TitanInterfaceRuntime\System\Http\Controllers;
use App\Extensions\TitanInterfaceRuntime\System\Contracts\Context\InterfaceContextStoreContract;
use App\Extensions\TitanInterfaceRuntime\System\Contracts\Offline\OfflineSyncWorkspaceContract;
use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
final class OfflineSyncWorkspaceController extends Controller
{
    public function __invoke(Request $request,InterfaceContextStoreContract $contexts,OfflineSyncWorkspaceContract $sync):JsonResponse
    {
        $context=$contexts->current();if($context===null)abort(500,'Interface context is unavailable.');
        $limit=max(1,min(200,(int)$request->query('limit',100)));
        return response()->json($sync->compose($context,$limit)->jsonSerialize());
    }
}
