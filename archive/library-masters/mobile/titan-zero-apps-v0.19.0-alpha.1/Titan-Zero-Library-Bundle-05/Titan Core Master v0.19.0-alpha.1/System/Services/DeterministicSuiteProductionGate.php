<?php
declare(strict_types=1);

namespace App\Extensions\TitanAppsCore\System\Services;

use App\Extensions\TitanAppsCore\System\Contracts\SuiteProductionGate;

final class DeterministicSuiteProductionGate implements SuiteProductionGate
{
    private const REQUIRED = [
        'zero','core','go','hub','interaction-engine','interface-runtime','builder','visual-runtime',
    ];

    public function requirements(): array
    {
        return [
            'stable_release_identity'=>['blocking'=>true,'description'=>'Active package metadata has no alpha/beta/recovery/reconstructed release identity.'],
            'company_boundary'=>['blocking'=>true,'description'=>'company_id is the sole canonical company boundary; legacy tenant identifiers are compatibility-only and fail closed on mismatch.'],
            'public_contracts'=>['blocking'=>true,'description'=>'Stable public contracts and compatibility policy exist for cross-extension consumers.'],
            'runtime_health'=>['blocking'=>true,'description'=>'Runtime exposes deterministic readiness/health diagnostics.'],
            'dependency_readiness'=>['blocking'=>true,'description'=>'Required suite-runtime dependencies resolve without package-path authority.'],
            'migration_safety'=>['blocking'=>true,'description'=>'Schema/data migrations are idempotent, reversible where practical, and preserve compatibility evidence.'],
            'governed_execution'=>['blocking'=>true,'description'=>'App surfaces cannot bypass governed capability execution.'],
            'offline_integrity'=>['blocking'=>true,'description'=>'Offline replay is company-scoped, actor-scoped, idempotent and conflict-aware.'],
            'observability'=>['blocking'=>true,'description'=>'Correlation, receipts, diagnostics and failure states are visible without exposing secrets.'],
            'rollback_recovery'=>['blocking'=>true,'description'=>'Release/runtime recovery and rollback paths are explicit and tested.'],
            'host_boot'=>['blocking'=>true,'description'=>'Providers, routes, middleware, views and container bindings boot in the real host application.'],
            'verification'=>['blocking'=>true,'description'=>'Tests, PHP syntax, JSON/schema validation, package integrity and eight-suite verification pass.'],
        ];
    }

    public function evaluate(array $extensions): array
    {
        $requirements=$this->requirements();
        $results=[];
        $blocking=[];
        foreach(self::REQUIRED as $id){
            $profile=$extensions[$id]??null;
            if(!is_array($profile)){
                $results[$id]=['ready'=>false,'missing_profile'=>true,'gates'=>[]];
                $blocking[]=$id.':missing_profile';
                continue;
            }
            $gates=[];
            foreach($requirements as $gate=>$definition){
                $passed=($profile[$gate]??false)===true;
                $gates[$gate]=['passed'=>$passed,'blocking'=>(bool)$definition['blocking']];
                if(!$passed&&$definition['blocking'])$blocking[]=$id.':'.$gate;
            }
            $results[$id]=['ready'=>!in_array(false,array_column($gates,'passed'),true),'gates'=>$gates];
        }
        return [
            'generation'=>'Titan Apps 10.x',
            'target_version_line'=>'10.20.x',
            'ready'=>$blocking===[],
            'extensions'=>$results,
            'blocking_failures'=>$blocking,
            'version_promotion_allowed'=>$blocking===[],
        ];
    }
}
