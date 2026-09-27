<?php

declare(strict_types=1);

namespace App\Extensions\TitanInterfaceRuntime\System\Http\Controllers;

use App\Extensions\TitanInterfaceRuntime\System\Contracts\Context\InterfaceContextStoreContract;
use App\Extensions\TitanInterfaceRuntime\System\Contracts\GlobalWork\GlobalWorkTrayAggregatorContract;
use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

final class GlobalWorkTrayController extends Controller
{
    public function __invoke(
        Request $request,
        string $tray,
        InterfaceContextStoreContract $contexts,
        GlobalWorkTrayAggregatorContract $trays,
    ): JsonResponse {
        $rawLimit = $request->query('limit');
        $limit = $rawLimit === null ? null : filter_var($rawLimit, FILTER_VALIDATE_INT, ['options'=>['min_range'=>1,'max_range'=>200]]);
        if ($rawLimit !== null && $limit === false) abort(422, 'limit must be an integer between 1 and 200.');
        return response()->json($trays->aggregate($contexts->requireCurrent(), $tray, $limit === false ? null : $limit)->jsonSerialize());
    }
}
