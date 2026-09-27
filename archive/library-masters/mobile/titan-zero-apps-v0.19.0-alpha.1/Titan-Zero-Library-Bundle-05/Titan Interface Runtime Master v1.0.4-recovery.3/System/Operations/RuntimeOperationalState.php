<?php

declare(strict_types=1);
namespace App\Extensions\TitanInterfaceRuntime\System\Operations;
use Illuminate\Contracts\Config\Repository as ConfigRepository;
final readonly class RuntimeOperationalState
{
    private const STAGES=['DISABLED','INTERNAL','CANARY','TENANT_COHORT','GENERAL'];
    private const STATES=['ACTIVE','DEGRADED','MAINTENANCE','DRAINING','DISABLED','UNINSTALLING'];
    public function __construct(private ConfigRepository $config) {}
    public function enabled(): bool { return (bool)$this->config->get('titan-interface-runtime.enabled',true); }
    public function killSwitch(): bool { return (bool)$this->config->get('titan-interface-runtime.rollout.kill_switch',false); }
    public function stage(): string { $v=strtoupper((string)$this->config->get('titan-interface-runtime.rollout.stage','GENERAL')); return in_array($v,self::STAGES,true)?$v:'DISABLED'; }
    public function maintenanceState(): string { $v=strtoupper((string)$this->config->get('titan-interface-runtime.rollout.maintenance_state','ACTIVE')); return in_array($v,self::STATES,true)?$v:'DISABLED'; }
    public function acceptsTraffic(): bool { return $this->enabled() && !$this->killSwitch() && $this->stage()!=='DISABLED' && in_array($this->maintenanceState(),['ACTIVE','DEGRADED'],true); }
    /** @return array<string,mixed> */
    public function liveness(): array { return ['status'=>'HEALTHY','alive'=>true,'extension'=>'titan-interface-runtime']; }
    /** @return array<string,mixed> */
    public function readiness(): array
    {
        $ready=$this->acceptsTraffic();
        return ['status'=>$ready?($this->maintenanceState()==='DEGRADED'?'DEGRADED':'READY'):'NOT_READY','ready'=>$ready,'enabled'=>$this->enabled(),'kill_switch'=>$this->killSwitch(),'rollout_stage'=>$this->stage(),'maintenance_state'=>$this->maintenanceState()];
    }
}
