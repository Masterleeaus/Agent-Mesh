<?php

declare(strict_types=1);

namespace App\Extensions\TitanMapsIntelligence\Http\Controllers;

use App\Extensions\TitanMapsIntelligence\Contracts\AuthorisedCompanyContext;
use App\Extensions\TitanMapsIntelligence\Models\GeographicPricingSignal;
use App\Extensions\TitanMapsIntelligence\Models\TerritoryEvaluation;
use App\Extensions\TitanMapsIntelligence\Services\ServiceTerritoryService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;

final class GeographicPricingController
{
    public function __construct(private readonly ServiceTerritoryService $territories, private readonly AuthorisedCompanyContext $context) {}
    public function evaluate(Request $request): JsonResponse|RedirectResponse
    {
        $data=$request->validate(['latitude'=>['nullable','numeric','between:-90,90'],'longitude'=>['nullable','numeric','between:-180,180'],'suburb'=>['nullable','string','max:120'],'postcode'=>['nullable','string','max:24'],'service_key'=>['nullable','string','max:120'],'target_reference_type'=>['nullable','string','max:40'],'target_public_reference_id'=>['nullable','string','max:191']]);
        $evaluation=$this->territories->evaluate($data);
        if($request->expectsJson()) return response()->json(['data'=>$evaluation]);
        return redirect()->route('dashboard.user.titan-maps-intelligence.territories.geographic-pricing')->with('status','Geographic coverage evaluated.')->with('territory_evaluation_id',(string)$evaluation->id);
    }
    public function evaluations(): JsonResponse { return response()->json(['data'=>TerritoryEvaluation::query()->forCompany($this->context->companyId())->with('signals')->latest('evaluated_at')->limit(100)->get()]); }
    public function signals(): JsonResponse { return response()->json(['data'=>GeographicPricingSignal::query()->forCompany($this->context->companyId())->latest('emitted_at')->limit(200)->get()]); }
}
