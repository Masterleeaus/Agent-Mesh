<?php

declare(strict_types=1);
namespace App\Extensions\TitanHub\System\Operations;

use App\Extensions\TitanHub\System\Contracts\CustomerOperationsGateway;
use App\Extensions\TitanHub\System\Contracts\HubContributionRegistry;
use DomainException;

/**
 * Hub owns orchestration/presentation only. Domain contributors own truth and writes.
 * CRM may decorate this gateway with CRM-owned commercial/customer projections.
 */
final class AggregatingCustomerOperationsGateway implements CustomerOperationsGateway
{
    public function __construct(private HubContributionRegistry $registry) {}

    public function home(array $context): array { return ['surface'=>'hub','summary'=>$this->homeSummary($context),'jobs'=>$this->jobs($context,['limit'=>5]),'bookings'=>$this->bookings($context,['limit'=>5]),'quotes'=>$this->quotes($context,['limit'=>5]),'invoices'=>$this->invoices($context,['limit'=>5])]; }
    public function homeSummary(array $context): array { return $this->mergeReads('home.summary',$context); }
    public function services(array $context,array $filters=[]): array { return $this->listRead('services.list',$context,$filters); }
    public function serviceRequests(array $context,array $filters=[]): array { return $this->listRead('service_requests.list',$context,$filters); }
    public function serviceRequest(array $context,string $id): ?array { return $this->oneRead('service_requests.read',$context,['id'=>$id]); }
    public function createServiceRequest(array $context,array $payload): array { return $this->oneAction('service_requests.create',$context,$payload); }
    public function jobs(array $context,array $filters=[]): array { return $this->listRead('jobs.list',$context,$filters); }
    public function job(array $context,string $id): ?array { return $this->oneRead('jobs.read',$context,['id'=>$id]); }
    public function workOrders(array $context,array $filters=[]): array { return $this->listRead('work_orders.list',$context,$filters); }
    public function workOrder(array $context,string $id): ?array { return $this->oneRead('work_orders.read',$context,['id'=>$id]); }
    public function bookings(array $context,array $filters=[]): array { return $this->listRead('bookings.list',$context,$filters); }
    public function requestBookingChange(array $context,string $id,array $payload): array { return $this->oneAction('bookings.request_change',$context,['id'=>$id]+$payload); }
    public function support(array $context,array $filters=[]): array { return $this->listRead('support.list',$context,$filters); }
    public function locations(array $context,array $filters=[]): array { return $this->listRead('locations.list',$context,$filters); }
    public function quotes(array $context,array $filters=[]): array { return $this->listRead('quotes.list',$context,$filters); }
    public function quote(array $context,string $id): ?array { return $this->oneRead('quotes.read',$context,['id'=>$id]); }
    public function approveQuote(array $context,string $id,array $payload=[]): array { return $this->oneAction('quotes.approve',$context,['id'=>$id]+$payload); }
    public function invoices(array $context,array $filters=[]): array { return $this->listRead('invoices.list',$context,$filters); }
    public function invoice(array $context,string $id): ?array { return $this->oneRead('invoices.read',$context,['id'=>$id]); }
    public function documents(array $context,array $filters=[]): array { return $this->listRead('documents.list',$context,$filters); }
    public function profile(array $context): array { return $this->mergeReads('profile.read',$context); }

    private function listRead(string $op,array $context,array $args=[]): array
    {
        $out=[];
        foreach($this->registry->contributors($op) as $c){try{$value=$c->read($op,$context,$args);}catch(\Throwable){continue;}if(is_array($value)){$out=array_merge($out,array_is_list($value)?$value:[$value]);}}
        return $out;
    }
    private function mergeReads(string $op,array $context,array $args=[]): array
    {
        $out=[];foreach($this->registry->contributors($op) as $c){try{$value=$c->read($op,$context,$args);}catch(\Throwable){continue;}if(is_array($value))$out=array_replace_recursive($out,$value);}return $out;
    }
    private function oneRead(string $op,array $context,array $args=[]): ?array
    {
        foreach($this->registry->contributors($op) as $c){try{$value=$c->read($op,$context,$args);}catch(\Throwable){continue;}if(is_array($value)&&$value!==[])return $value;}return null;
    }
    private function oneAction(string $op,array $context,array $payload=[]): array
    {
        $contributors=$this->registry->contributors($op);
        if(count($contributors)!==1) throw new DomainException(count($contributors)===0?"No governed provider registered for {$op}.":"Ambiguous governed providers registered for {$op}.");
        $result=$contributors[0]->act($op,$context,$payload);
        if(!is_array($result)) throw new DomainException("Provider {$op} must return a governed receipt array.");
        return $result;
    }
}
