<?php

declare(strict_types=1);

namespace App\Extensions\TitanInterfaceRuntime\System\Http\Controllers;

use App\Extensions\TitanInterfaceRuntime\System\Contracts\Command\CommandSurfaceContract;
use App\Extensions\TitanInterfaceRuntime\System\Contracts\Context\InterfaceContextStoreContract;
use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

final class CommandSurfaceController extends Controller
{
    public function __invoke(
        Request $request,
        InterfaceContextStoreContract $contexts,
        CommandSurfaceContract $commands,
    ): JsonResponse {
        $query=$request->query('q','');
        if (! is_string($query)) abort(422,'q must be a string.');
        $rawLimit=$request->query('limit');
        $limit=$rawLimit===null ? null : filter_var($rawLimit,FILTER_VALIDATE_INT,['options'=>['min_range'=>1,'max_range'=>100]]);
        if ($rawLimit!==null && $limit===false) abort(422,'limit must be an integer between 1 and 100.');
        try {
            return response()->json($commands->search($query,$contexts->requireCurrent(),$limit===false?null:$limit)->jsonSerialize());
        } catch (\InvalidArgumentException $e) {
            return response()->json(['message'=>$e->getMessage()],422);
        }
    }
}
