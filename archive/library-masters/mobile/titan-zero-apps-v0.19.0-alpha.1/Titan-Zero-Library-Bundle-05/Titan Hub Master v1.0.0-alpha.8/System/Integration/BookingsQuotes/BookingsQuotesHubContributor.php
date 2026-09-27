<?php

declare(strict_types=1);
namespace App\Extensions\TitanHub\System\Integration\BookingsQuotes;

use App\Extensions\TitanHub\System\Contracts\CustomerOperationsContributor;
use DomainException;

/** Compatibility adapter over Titan Bookings & Quotes public ports. */
final class BookingsQuotesHubContributor implements CustomerOperationsContributor
{
    public function __construct(private object $reads, private object $commands) {}

    public function supports(): array
    {
        return ['bookings.list','bookings.read','bookings.create','bookings.request_change'];
    }

    public function read(string $operation,array $context,array $arguments=[]): mixed
    {
        [$company,$customer]=$this->authority($context);
        return match($operation){
            'bookings.list'=>$this->reads->pageForCustomer($company,$customer,min(100,max(1,(int)($arguments['limit']??25))),$arguments['cursor']??null)['data']??[],
            'bookings.read'=>$this->reads->findForCustomer($company,$customer,(string)($arguments['id']??'')),
            default=>[],
        };
    }

    public function act(string $operation,array $context,array $payload=[]): mixed
    {
        [$company,$customer]=$this->authority($context);
        $actor=['company_id'=>$company,'customer_ref'=>$customer,'actor_ref'=>(string)($context['actor_id']??''),'roles'=>['customer'],'surface'=>'hub'];
        if($operation==='bookings.create'){
            $payload['booking_ref']=$payload['booking_ref']??('bkg_'.bin2hex(random_bytes(12)));
            $payload['customer_ref']=$customer;
            return $this->commands->execute($company,'bookings.create',$payload,$actor);
        }
        if($operation==='bookings.request_change'){
            // A requested change is an intent; Bookings owns whether a concrete command is currently supported.
            return $this->commands->execute($company,'bookings.request_change',$payload,$actor);
        }
        throw new DomainException("Unsupported Bookings/Quotes Hub action: {$operation}");
    }

    private function authority(array $context): array
    {
        $company=(int)($context['company_id']??0);
        $customer=trim((string)($context['customer_ref']??$context['customer_identity']??''));
        if($company<1||$customer==='') throw new DomainException('Trusted Hub company/customer authority is required.');
        return [$company,$customer];
    }
}
