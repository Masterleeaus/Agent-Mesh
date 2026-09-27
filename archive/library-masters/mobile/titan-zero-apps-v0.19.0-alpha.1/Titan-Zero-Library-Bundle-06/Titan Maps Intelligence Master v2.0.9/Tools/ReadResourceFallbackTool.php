<?php

declare(strict_types=1);
namespace App\Extensions\TitanMapsIntelligence\Tools;
use App\Extensions\TitanMapsIntelligence\Contracts\AuthorisedCompanyContext;
use App\Extensions\TitanMapsIntelligence\Models\ResourceFallbackRequest;
use App\Extensions\TitanMapsIntelligence\Services\ResourceFallbackService;
final class ReadResourceFallbackTool
{
    public function __construct(private readonly AuthorisedCompanyContext $context,private readonly ResourceFallbackService $service) {}
    public function execute(array $input): array
    {
        $id=trim((string)($input['fallback_request_id']??''));
        if($id!==''){$r=ResourceFallbackRequest::query()->forCompany($this->context->companyId())->whereKey($id)->firstOrFail();$r=$this->service->refresh($r);return ['ok'=>true,'data'=>$r->load(['candidates.discoveryCandidate.place','decisions','discoverySearch'])->toArray()];}
        $limit=min(100,max(1,(int)($input['limit']??20)));$rows=ResourceFallbackRequest::query()->forCompany($this->context->companyId())->with(['candidates','decisions'])->latest('created_at')->limit($limit)->get();return ['ok'=>true,'data'=>$rows->toArray()];
    }
}
