<?php

declare(strict_types=1);

namespace App\Extensions\TitanMapsIntelligence\Services;

use App\Extensions\TitanMapsIntelligence\Contracts\WorkerQualificationGateway;
use App\Extensions\TitanMapsIntelligence\DTO\DispatchJobContext;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

final class TitanFieldWorkerQualificationGateway implements WorkerQualificationGateway
{
    public function evidence(string $companyId, string $workerPublicId, string $workerUserId, DispatchJobContext $job): array
    {
        if(!ctype_digit($companyId)||!ctype_digit($workerUserId)||!Schema::hasTable('crm_field_worker_profiles'))return ['status'=>'unknown','skills'=>[],'certifications'=>[],'source'=>'titan-field-unavailable'];
        $row=DB::table('crm_field_worker_profiles')->where('company_id',(int)$companyId)->where('worker_user_id',(int)$workerUserId)->where('active',true)->first();
        if(!$row)return ['status'=>'unknown','skills'=>[],'certifications'=>[],'source'=>'titan-field'];
        $skills=$this->list($row->skills??null); $meta=$this->json($row->metadata??null);
        $certs=[]; foreach((array)($meta['certifications']??[]) as $cert){if(is_string($cert))$certs[]=['key'=>$cert,'status'=>'valid'];elseif(is_array($cert))$certs[]=$cert;}
        return ['status'=>'available','skills'=>$skills,'certifications'=>$certs,'source'=>'titan-field'];
    }
    private function list(mixed $v):array{if(is_string($v)){$d=json_decode($v,true);$v=is_array($d)?$d:[$v];}if(!is_array($v))return[];$o=[];foreach($v as $x){$y=is_array($x)?($x['key']??$x['name']??null):$x;if(is_scalar($y)&&trim((string)$y)!=='')$o[]=trim((string)$y);}return array_values(array_unique($o));}
    private function json(mixed $v):array{if(is_array($v))return$v;if(!is_string($v)||trim($v)==='')return[];$d=json_decode($v,true);return is_array($d)?$d:[];}
}
