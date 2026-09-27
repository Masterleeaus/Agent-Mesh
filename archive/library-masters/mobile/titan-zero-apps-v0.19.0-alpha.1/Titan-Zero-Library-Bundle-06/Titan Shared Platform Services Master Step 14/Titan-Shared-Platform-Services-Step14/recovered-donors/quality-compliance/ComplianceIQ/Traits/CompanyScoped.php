<?php
namespace Modules\ComplianceIQ\Traits;
use Illuminate\Database\Eloquent\Builder; use Modules\TitanZeroAssurance\Services\ExecutionContextStore;
trait CompanyScoped { public static function bootCompanyScoped():void { static::addGlobalScope('company_id',function(Builder $q):void { $id=self::companyId(); if(!$id){$q->whereRaw('1=0');return;} $q->where($q->getModel()->getTable().'.company_id',$id);}); static::creating(function($m):void{if(empty($m->company_id)){ $id=self::companyId(); if(!$id) throw new \LogicException('ComplianceIQ requires company_id context.'); $m->company_id=$id;}}); }
private static function companyId():?int { try{$c=app(ExecutionContextStore::class)->current();if($c)return $c->companyId;}catch(\Throwable){} $u=auth()->user();return isset($u->company_id)&&(int)$u->company_id>0?(int)$u->company_id:null;}}
