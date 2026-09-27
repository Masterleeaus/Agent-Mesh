<?php

declare(strict_types=1);

namespace App\Extensions\TitanMapsIntelligence\Services;

use App\Extensions\TitanMapsIntelligence\Contracts\FieldReferenceGateway;
use App\Extensions\TitanMapsIntelligence\DTO\FieldReference;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/** Preferred operational reference reader when Titan Field is installed. */
final class TitanFieldReferenceGateway implements FieldReferenceGateway
{
    public function __construct(private readonly WorkCoreFieldReferenceGateway $fallback) {}

    public function resolve(string $companyId, string $referenceType, string $publicReferenceId): ?FieldReference
    {
        if (!ctype_digit($companyId) || trim($publicReferenceId)==='') return $this->fallback->resolve($companyId,$referenceType,$publicReferenceId);
        $tenant=(int)$companyId;
        if ($referenceType==='job' && Schema::hasTable('crm_work_orders')) {
            $q=DB::table('crm_work_orders')->where('company_id',$tenant)->where('public_id',$publicReferenceId);
            if(Schema::hasColumn('crm_work_orders','deleted_at'))$q->whereNull('deleted_at');
            $row=$q->first(); if(!$row)return null;
            $address=$this->locationAddress($tenant,$row->location_public_id??null);
            return new FieldReference($companyId,'job',$publicReferenceId,$address,null,null);
        }
        if ($referenceType==='property' && Schema::hasTable('crm_service_locations')) {
            $q=DB::table('crm_service_locations')->where('company_id',$tenant)->where('public_id',$publicReferenceId);
            if(Schema::hasColumn('crm_service_locations','deleted_at'))$q->whereNull('deleted_at');
            $row=$q->first(); if(!$row)return null;
            return new FieldReference($companyId,'property',$publicReferenceId,$this->formatAddress($row),null,null);
        }
        if ($referenceType==='worker' && Schema::hasTable('crm_field_worker_profiles')) {
            $id=ctype_digit($publicReferenceId)?(int)$publicReferenceId:null;
            if($id===null)return null;
            $row=DB::table('crm_field_worker_profiles')->where('company_id',$tenant)->where('worker_user_id',$id)->where('active',true)->first();
            if(!$row)return null;
            return new FieldReference($companyId,'worker',$publicReferenceId,null,null,null);
        }
        // branch/supplier/contractor remain available through the older generic host bridge.
        return $this->fallback->resolve($companyId,$referenceType,$publicReferenceId);
    }

    private function locationAddress(int $tenant,mixed $publicId): ?string
    {
        if(!is_scalar($publicId)||trim((string)$publicId)===''||!Schema::hasTable('crm_service_locations'))return null;
        $q=DB::table('crm_service_locations')->where('company_id',$tenant)->where('public_id',(string)$publicId);
        if(Schema::hasColumn('crm_service_locations','deleted_at'))$q->whereNull('deleted_at');
        $row=$q->first(); return $row?$this->formatAddress($row):null;
    }

    private function formatAddress(object $row): ?string
    {
        $parts=array_values(array_filter([
            trim((string)($row->address_line_1??'')),trim((string)($row->address_line_2??'')),trim((string)($row->suburb??'')),trim((string)($row->state??'')),trim((string)($row->postcode??'')),trim((string)($row->country??'')),
        ],static fn($v)=>$v!==''));
        return $parts===[]?null:implode(', ',$parts);
    }
}
