<?php

declare(strict_types=1);

namespace App\Extensions\TitanInterfaceRuntime\System\Http\Controllers;

use App\Extensions\TitanInterfaceRuntime\System\Authority\ReadQuery;
use App\Extensions\TitanInterfaceRuntime\System\Contracts\Context\InterfaceContextStoreContract;
use App\Extensions\TitanInterfaceRuntime\System\Contracts\Spatial\SpatialWorkspaceContract;
use App\Extensions\TitanInterfaceRuntime\System\Spatial\SpatialWorkspaceException;
use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

final class SpatialWorkspaceController extends Controller
{
    public function __invoke(Request $request, string $objectKey, InterfaceContextStoreContract $contexts, SpatialWorkspaceContract $spatial): JsonResponse
    {
        $filters=$request->query('filters',[]); $sort=$request->query('sort',[]);
        if (! is_array($filters) || ! is_array($sort)) abort(422,'filters and sort must be arrays.');
        $page=filter_var($request->query('page',1),FILTER_VALIDATE_INT,['options'=>['min_range'=>1,'max_range'=>100000]]);
        $perPage=filter_var($request->query('per_page',100),FILTER_VALIDATE_INT,['options'=>['min_range'=>1,'max_range'=>ReadQuery::MAX_PER_PAGE]]);
        if ($page===false || $perPage===false) abort(422,'page or per_page is outside the supported read budget.');
        $view=$request->query('view');
        if ($view!==null && (! is_string($view) || preg_match('/^[a-z0-9][a-z0-9._-]{0,127}$/',$view)!==1)) abort(422,'view contains an unsafe token.');
        $search=$request->query('search'); if ($search!==null && ! is_string($search)) abort(422,'search must be a string.');
        $query=new ReadQuery($filters,$sort,(int)$page,(int)$perPage,null,$search);
        try {
            return response()->json($spatial->open($objectKey,$contexts->requireCurrent(),$query,$view)->jsonSerialize());
        } catch (SpatialWorkspaceException $e) {
            abort(404,$e->getMessage());
        }
    }
}
