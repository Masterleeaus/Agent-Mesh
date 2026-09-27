<?php

declare(strict_types=1);

namespace App\Extensions\TitanInterfaceRuntime\System\Http\Controllers;

use App\Extensions\TitanInterfaceRuntime\System\Authority\ReadQuery;
use App\Extensions\TitanInterfaceRuntime\System\Configuration\ConfigurationLifecycleWorkspaceException;
use App\Extensions\TitanInterfaceRuntime\System\Contracts\Configuration\ConfigurationLifecycleWorkspaceContract;
use App\Extensions\TitanInterfaceRuntime\System\Contracts\Context\InterfaceContextStoreContract;
use App\Extensions\TitanInterfaceRuntime\System\Objects\ObjectReference;
use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

final class ConfigurationLifecycleWorkspaceController extends Controller
{
    public function __invoke(Request $request,string $objectReference,InterfaceContextStoreContract $contexts,ConfigurationLifecycleWorkspaceContract $workspace): JsonResponse
    {
        $view=$request->query('view');if($view!==null&&(!is_string($view)||preg_match('/^[a-z0-9][a-z0-9._-]{0,127}$/',$view)!==1))abort(422,'view contains an unsafe token.');
        try{return response()->json($workspace->open(ObjectReference::parse($objectReference),$contexts->requireCurrent(),new ReadQuery(),$view)->jsonSerialize());}
        catch(ConfigurationLifecycleWorkspaceException $e){abort(404,$e->getMessage());}
    }
}
