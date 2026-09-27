<?php

declare(strict_types=1);

namespace App\Extensions\TitanInterfaceRuntime\System\Http\Controllers;

use App\Extensions\TitanInterfaceRuntime\System\Contracts\Context\InterfaceContextStoreContract;
use App\Extensions\TitanInterfaceRuntime\System\Contracts\Governance\GovernanceWorkspaceContract;
use App\Extensions\TitanInterfaceRuntime\System\Governance\GovernanceWorkspaceException;
use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

final class GovernanceWorkspaceController extends Controller
{
    public function __invoke(
        Request $request,
        string $objectReference,
        string $actionKey,
        InterfaceContextStoreContract $contexts,
        GovernanceWorkspaceContract $governance,
    ): JsonResponse {
        $receiptId=$request->query('receipt_id');
        $approvalId=$request->query('approval_id');
        foreach(['receipt_id'=>$receiptId,'approval_id'=>$approvalId] as$field=>$value){
            if($value!==null&&(!is_string($value)||preg_match('/^[A-Za-z0-9._:-]{1,160}$/',$value)!==1))abort(422,"{$field} contains an unsafe identifier.");
        }
        try {
            return response()->json($governance->open($objectReference,$actionKey,$contexts->requireCurrent(),$receiptId,$approvalId)->jsonSerialize());
        } catch (GovernanceWorkspaceException $e) {
            abort(404,$e->getMessage());
        }
    }
}
