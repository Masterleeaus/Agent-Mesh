<?php
declare(strict_types=1);
namespace App\Extensions\TitanVisualRuntime\System\Runtime;

use App\Extensions\TitanVisualRuntime\System\Contracts\{VisualContributionSnapshot,VisualContributionRegistry};

final class DeterministicVisualContributionSnapshot implements VisualContributionSnapshot
{
    public function __construct(private readonly VisualContributionRegistry $registry) {}

    public function snapshot(?string $companyId=null): array
    {
        $items=$this->registry->all($companyId);
        $normalized=[];

        foreach($items as $c){
            $normalized[]=[
                'id'=>$c['id']??null,
                'provider'=>$c['provider']??null,
                'company_id'=>$c['company_id']??null,
                'surfaces'=>array_values($c['surfaces']??[]),
                'treatment'=>$c['treatment']??null,
                'version'=>$c['version']??'1.0.0',
            ];
        }

        usort($normalized,fn($a,$b)=>strcmp(($a['company_id']??'*').'|'.$a['id'].'|'.$a['provider'],($b['company_id']??'*').'|'.$b['id'].'|'.$b['provider']));
        $json=json_encode($normalized,JSON_THROW_ON_ERROR|JSON_UNESCAPED_SLASHES);

        return [
            'items'=>$normalized,
            'count'=>count($normalized),
            'sha256'=>hash('sha256',$json),
            'deterministic'=>true,
            'business_authority'=>false,
            'tenant_boundary'=>'company_id',
        ];
    }
}
