<?php

declare(strict_types=1);

namespace App\Extensions\TitanMapsIntelligence\Tools;

use App\Extensions\TitanMapsIntelligence\Contracts\AuthorisedCompanyContext;
use App\Extensions\TitanMapsIntelligence\Contracts\PermissionAuthorizer;
use App\Extensions\TitanMapsIntelligence\Models\TerritoryAnalysis;
use App\Extensions\TitanMapsIntelligence\Services\MapsConfiguration;

final class ReadTerritoryAnalyticsTool
{
    public function __construct(private readonly AuthorisedCompanyContext $context,private readonly PermissionAuthorizer $authorizer,private readonly MapsConfiguration $configuration) {}
    public function execute(array $input): array
    {
        $company=$this->context->companyId();$this->authorizer->authorize($this->context->userId(),$company,'titan-maps-intelligence.territory.analyse');$limit=max(1,min($this->configuration->territoryAnalyticsHistoryLimit(),(int)($input['limit']??30)));$type=(string)($input['analysis_type']??'');
        $q=TerritoryAnalysis::query()->forCompany($company)->with('cells')->latest('generated_at');if($type!=='')$q->where('analysis_type',$type);
        return ['ok'=>true,'data'=>$q->limit($limit)->get()->map(fn($a)=>['id'=>(string)$a->id,'analysis_type'=>$a->analysis_type,'methodology_key'=>$a->methodology_key,'methodology_version'=>$a->methodology_version,'area_square_km'=>$a->area_square_km,'metrics'=>$a->generated_metrics,'findings'=>$a->findings,'confidence'=>$a->confidence,'generated_at'=>$a->generated_at?->toAtomString(),'cells'=>$a->cells->map(fn($c)=>['cell_key'=>$c->cell_key,'score'=>$c->score,'confidence'=>$c->confidence,'metrics'=>$c->metrics])->all()])->all()];
    }
}
