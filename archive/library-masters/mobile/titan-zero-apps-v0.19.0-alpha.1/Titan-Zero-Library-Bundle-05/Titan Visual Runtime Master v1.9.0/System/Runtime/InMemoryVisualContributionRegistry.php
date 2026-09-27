<?php
declare(strict_types=1);
namespace App\Extensions\TitanVisualRuntime\System\Runtime;

use App\Extensions\TitanVisualRuntime\System\Contracts\{VisualContributionRegistry,VisualContributionSource};
use InvalidArgumentException;

final class InMemoryVisualContributionRegistry implements VisualContributionRegistry
{
    private array $items=[];
    private const MAX_CONTRIBUTIONS=1000;

    public function __construct(private readonly VisualMetadataGuard $guard) {}

    public function register(array $c): void
    {
        $this->guard->validate($c);

        foreach(['id','provider','surfaces','treatment'] as $k) {
            if(!array_key_exists($k,$c)) throw new InvalidArgumentException("Visual contribution missing {$k}");
        }

        if(!is_string($c['id']) || !preg_match('/^[a-z0-9][a-z0-9._:-]{0,127}$/',$c['id'])) throw new InvalidArgumentException('Invalid visual contribution id.');
        if(!is_string($c['provider']) || !preg_match('/^[a-z0-9][a-z0-9._-]{0,127}$/',$c['provider'])) throw new InvalidArgumentException('Invalid visual contribution provider.');

        // company_id is the sole canonical tenant/company boundary.
        // tenantId/tenant_id are compatibility inputs only and are never retained as a second scope.
        $legacy=$c['tenantId'] ?? $c['tenant_id'] ?? null;
        $company=$c['company_id'] ?? $legacy;

        if(isset($c['company_id']) && $legacy!==null && $c['company_id']!==$legacy) {
            throw new InvalidArgumentException('Conflicting company_id and legacy tenant identifier.');
        }
        if($company!==null && (!is_string($company) || !preg_match('/^[A-Za-z0-9._:-]{1,128}$/',$company))) {
            throw new InvalidArgumentException('Invalid company_id.');
        }

        unset($c['tenantId'],$c['tenant_id']);
        if($company!==null) $c['company_id']=$company;

        $c['version']=$c['version']??'1.0.0';
        if(!preg_match('/^\d+\.\d+\.\d+$/',(string)$c['version'])) throw new InvalidArgumentException('Invalid visual contribution version.');
        if((int)explode('.', (string)$c['version'])[0]!==1) throw new InvalidArgumentException('Unsupported visual contribution major version.');

        if(!is_array($c['surfaces']) || $c['surfaces']===[]) throw new InvalidArgumentException('Visual contribution surfaces must be a non-empty list.');
        foreach($c['surfaces'] as $s) if(!in_array($s,['zero','go','hub'],true)) throw new InvalidArgumentException('Unsupported surface');

        $scope=$company ?? '*';
        $key=$scope.'|'.$c['id'];
        $existing=$this->items[$key]??null;

        if($existing!==null && $existing['provider']!==$c['provider']) {
            throw new InvalidArgumentException('Visual contribution id already owned by another provider for this company.');
        }
        if($existing!==null && version_compare((string)$c['version'],(string)($existing['version']??'1.0.0'),'<')) {
            throw new InvalidArgumentException('Older visual contribution version cannot replace newer version.');
        }
        if($existing===null && count($this->items)>=self::MAX_CONTRIBUTIONS) {
            throw new InvalidArgumentException('Visual contribution registry capacity exceeded.');
        }

        $this->items[$key]=$c;
    }

    public function registerSource(VisualContributionSource $source): void
    {
        $provider=$source->providerId();
        foreach($source->visualContributions() as $contribution){
            if(!is_array($contribution)) throw new InvalidArgumentException('Visual contribution source returned non-array contribution.');
            if(isset($contribution['provider']) && $contribution['provider']!==$provider) throw new InvalidArgumentException('Visual contribution source provider mismatch.');
            $contribution['provider']=$provider;
            $this->register($contribution);
        }
    }

    public function resolve(string $id,string $surface,?string $companyId=null): ?array
    {
        $keys=[];
        if($companyId!==null) $keys[]=$companyId.'|'.$id;
        $keys[]='*|'.$id;

        foreach($keys as $key){
            $c=$this->items[$key]??null;
            if($c && in_array($surface,$c['surfaces'],true)) return $c;
        }
        return null;
    }

    public function all(?string $companyId=null): array
    {
        $out=[];
        foreach($this->items as $c){
            $company=$c['company_id']??null;
            if($company===null || ($companyId!==null && $company===$companyId)) $out[]=$c;
        }
        usort($out,fn($a,$b)=>strcmp((string)$a['id'],(string)$b['id']) ?: strcmp((string)($a['company_id']??'*'),(string)($b['company_id']??'*')));
        return $out;
    }
}
