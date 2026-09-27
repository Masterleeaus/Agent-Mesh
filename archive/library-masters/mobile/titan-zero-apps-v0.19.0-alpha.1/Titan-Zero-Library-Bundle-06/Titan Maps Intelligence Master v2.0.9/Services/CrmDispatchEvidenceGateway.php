<?php

declare(strict_types=1);

namespace App\Extensions\TitanMapsIntelligence\Services;

use App\Extensions\TitanMapsIntelligence\Contracts\DispatchEvidenceGateway;
use App\Extensions\TitanMapsIntelligence\Contracts\WorkerQualificationGateway;
use App\Extensions\TitanMapsIntelligence\DTO\DispatchJobContext;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Throwable;

final class CrmDispatchEvidenceGateway implements DispatchEvidenceGateway
{
    public function __construct(private readonly WorkerQualificationGateway $qualifications, private readonly MapsConfiguration $configuration) {}

    public function job(string $companyId, string $jobPublicId): ?DispatchJobContext
    {
        $tenant = $this->crmTenant($companyId);
        if ($tenant === null || !Schema::hasTable('crm_work_orders')) return null;
        $q = DB::table('crm_work_orders')->where('company_id',$tenant)->where('public_id',$jobPublicId);
        if (Schema::hasColumn('crm_work_orders','deleted_at')) $q->whereNull('deleted_at');
        $row = $q->first();
        if (!$row) return null;
        $service = null;
        if (!empty($row->service_public_id) && Schema::hasTable('crm_services')) {
            $sq = DB::table('crm_services')->where('company_id',$tenant)->where('public_id',(string)$row->service_public_id);
            if (Schema::hasColumn('crm_services','deleted_at')) $sq->whereNull('deleted_at');
            $service = $sq->first();
        }
        $requiredSkills = $this->stringList($service?->required_skills ?? null);
        $fieldRequirements = $this->json($service?->field_requirements ?? null);
        $jobMeta = $this->json($row->metadata ?? null);
        $requiredCerts = array_values(array_unique(array_merge(
            $this->stringList($fieldRequirements['required_certifications'] ?? []),
            $this->stringList($jobMeta['required_certifications'] ?? [])
        )));
        return new DispatchJobContext(
            publicId:(string)$row->public_id,
            title:(string)($row->title ?? ('Job '.$row->public_id)),
            priority:(string)($row->priority ?? 'normal'),
            scheduledStart:isset($row->scheduled_start) && $row->scheduled_start !== null ? (string)$row->scheduled_start : null,
            scheduledEnd:isset($row->scheduled_end) && $row->scheduled_end !== null ? (string)$row->scheduled_end : null,
            servicePublicId:isset($row->service_public_id) ? (string)$row->service_public_id : null,
            locationPublicId:isset($row->location_public_id) ? (string)$row->location_public_id : null,
            companyPublicId:isset($row->company_public_id) ? (string)$row->company_public_id : null,
            contactPublicId:isset($row->contact_public_id) ? (string)$row->contact_public_id : null,
            requiredSkills:$requiredSkills,
            requiredCertifications:$requiredCerts,
            metadata:['source'=>'crm','company_id'=>$tenant,'work_order_metadata'=>$jobMeta],
        );
    }

    public function workerEvidence(string $companyId, DispatchJobContext $job, array $worker): array
    {
        $base = [
            'availability_status'=>'unknown','daily_workload'=>0,'daily_capacity'=>$this->configuration->dispatchDailyCapacity(),'continuity_count'=>0,
            'skill_match'=>$job->requiredSkills === [] ? 1.0 : 0.5,'skill_evidence'=>$job->requiredSkills === [] ? 'not_required' : 'unknown',
            'mandatory_certification_status'=>$job->requiredCertifications === [] ? 'not_required' : 'unknown',
            'required_skills'=>$job->requiredSkills,'required_certifications'=>$job->requiredCertifications,
        ];
        $tenant = $this->crmTenant($companyId);
        $workerUserId = trim((string)($worker['user_id'] ?? ''));
        if ($tenant === null || !ctype_digit($workerUserId)) return $base + ['source'=>'maps_only'];
        $uid = (int)$workerUserId;

        $start = $job->scheduledStart; $end = $job->scheduledEnd;
        if ($start !== null && $end !== null) {
            $conflict = 0;
            if (Schema::hasTable('crm_appointments')) {
                $q=DB::table('crm_appointments')->where('company_id',$tenant)->where('assigned_user_id',$uid)
                    ->whereNotIn('status',['cancelled','completed'])->where('scheduled_start','<',$end)->where('scheduled_end','>',$start);
                if (Schema::hasColumn('crm_appointments','deleted_at')) $q->whereNull('deleted_at');
                $conflict += $q->count();
            }
            if (Schema::hasTable('crm_dispatch_assignments')) {
                $q=DB::table('crm_dispatch_assignments')->where('company_id',$tenant)->where('worker_user_id',$uid)
                    ->whereNotIn('status',['completed','cancelled','failed'])->where('work_order_public_id','<>',$job->publicId)
                    ->whereNotNull('scheduled_start')->whereNotNull('scheduled_end')->where('scheduled_start','<',$end)->where('scheduled_end','>',$start);
                if (Schema::hasColumn('crm_dispatch_assignments','deleted_at')) $q->whereNull('deleted_at');
                $conflict += $q->count();
            }
            $base['availability_status'] = $conflict > 0 ? 'conflict' : 'available';
            $base['schedule_conflicts'] = $conflict;
        }

        if (Schema::hasTable('crm_dispatch_assignments')) {
            $date = $job->scheduledStart !== null ? substr($job->scheduledStart,0,10) : now()->toDateString();
            $q=DB::table('crm_dispatch_assignments')->where('company_id',$tenant)->where('worker_user_id',$uid)
                ->whereNotIn('status',['completed','cancelled','failed'])->whereDate('scheduled_start',$date);
            if (Schema::hasColumn('crm_dispatch_assignments','deleted_at')) $q->whereNull('deleted_at');
            $base['daily_workload']=$q->count();

            if (Schema::hasTable('crm_work_orders')) {
                $continuity = DB::table('crm_dispatch_assignments as d')->join('crm_work_orders as w',function($join){$join->on('w.public_id','=','d.work_order_public_id')->on('w.company_id','=','d.company_id');})
                    ->where('d.company_id',$tenant)->where('d.worker_user_id',$uid)->where('d.status','completed');
                if ($job->companyPublicId) $continuity->where('w.company_public_id',$job->companyPublicId);
                elseif ($job->contactPublicId) $continuity->where('w.contact_public_id',$job->contactPublicId);
                else $continuity->whereRaw('1=0');
                $base['continuity_count']=$continuity->count();

                if ($job->servicePublicId) {
                    $experience = DB::table('crm_dispatch_assignments as d')->join('crm_work_orders as w',function($join){$join->on('w.public_id','=','d.work_order_public_id')->on('w.company_id','=','d.company_id');})
                        ->where('d.company_id',$tenant)->where('d.worker_user_id',$uid)->where('d.status','completed')->where('w.service_public_id',$job->servicePublicId)->count();
                    $base['same_service_completed_count']=$experience;
                }
            }
        }

        $qualification = $this->qualifications->evidence($companyId,(string)($worker['worker_public_id']??''),$workerUserId,$job);
        $skills = array_map('strtolower',$this->stringList($qualification['skills'] ?? []));
        if ($job->requiredSkills !== [] && $skills !== []) {
            $required=array_map('strtolower',$job->requiredSkills); $matched=count(array_intersect($required,$skills));
            $base['skill_match']=$matched/max(1,count($required)); $base['skill_evidence']='explicit';
        } elseif ($job->requiredSkills !== [] && (int)($base['same_service_completed_count']??0) > 0) {
            $base['skill_match']=min(1.0,0.5+(0.1*(int)$base['same_service_completed_count'])); $base['skill_evidence']='experience';
        }
        if ($job->requiredCertifications !== []) {
            if (($qualification['status']??'unknown') === 'available') {
                $valid=[]; $failed=[];
                foreach ((array)($qualification['certifications']??[]) as $cert) {
                    if (!is_array($cert)) continue;
                    $key=strtolower(trim((string)($cert['key']??$cert['name']??''))); if ($key==='') continue;
                    if (($cert['status']??'valid') === 'valid') $valid[]=$key; else $failed[]=$key;
                }
                $required=array_map('strtolower',$job->requiredCertifications);
                $base['mandatory_certification_status']=count(array_diff($required,$valid))===0 ? 'verified' : 'failed';
                $base['certification_evidence']=['valid'=>$valid,'failed'=>$failed,'source'=>$qualification['source']??'host'];
            }
        }
        return $base + ['source'=>'crm','qualification_source'=>$qualification['source']??'unavailable'];
    }

    private function crmTenant(string $companyId): ?int
    {
        $scope='App\\Extensions\\Crm\\System\\Tenancy\\CrmCompanyScope';
        if (!class_exists($scope) || !ctype_digit($companyId)) return null;
        try { $tenant=(int)call_user_func([$scope,'companyId']); }
        catch (Throwable) { return null; }
        return hash_equals((string)$tenant,$companyId) ? $tenant : null;
    }

    /** @return array<string,mixed> */
    private function json(mixed $value): array
    {
        if (is_array($value)) return $value;
        if (!is_string($value) || trim($value)==='') return [];
        $decoded=json_decode($value,true); return is_array($decoded)?$decoded:[];
    }

    /** @return array<int,string> */
    private function stringList(mixed $value): array
    {
        if (is_string($value)) { $decoded=json_decode($value,true); $value=is_array($decoded)?$decoded:[$value]; }
        if (!is_array($value)) return [];
        $out=[]; foreach($value as $item){ if(is_scalar($item) && trim((string)$item)!=='')$out[]=trim((string)$item); elseif(is_array($item)){ $v=$item['key']??$item['name']??null; if(is_scalar($v)&&trim((string)$v)!=='')$out[]=trim((string)$v); } }
        return array_values(array_unique($out));
    }
}
