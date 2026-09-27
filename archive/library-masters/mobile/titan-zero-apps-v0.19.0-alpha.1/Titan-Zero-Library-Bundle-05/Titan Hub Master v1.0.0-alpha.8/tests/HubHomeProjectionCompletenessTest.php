<?php
declare(strict_types=1);
require_once dirname(__DIR__).'/System/Contracts/CustomerOperationsContributor.php';
require_once dirname(__DIR__).'/System/Contracts/HubContributionRegistry.php';
require_once dirname(__DIR__).'/System/Contracts/CustomerOperationsGateway.php';
require_once dirname(__DIR__).'/System/Operations/InMemoryHubContributionRegistry.php';
require_once dirname(__DIR__).'/System/Operations/AggregatingCustomerOperationsGateway.php';
use App\Extensions\TitanHub\System\Contracts\CustomerOperationsContributor;
use App\Extensions\TitanHub\System\Operations\InMemoryHubContributionRegistry;
use App\Extensions\TitanHub\System\Operations\AggregatingCustomerOperationsGateway;
function hhpc(bool $ok,string $message):void{if(!$ok){fwrite(STDERR,"FAIL: {$message}\n");exit(1);}echo "PASS: {$message}\n";}
$r=new InMemoryHubContributionRegistry();
$r->register(new class implements CustomerOperationsContributor{
    public function supports():array{return ['home.summary','jobs.list','bookings.list','quotes.list','invoices.list'];}
    public function read(string $o,array $c,array $a=[]):mixed{return match($o){
        'home.summary'=>['greeting'=>'Hi'],
        'jobs.list'=>[['id'=>'j1']],
        'bookings.list'=>[['id'=>'b1']],
        'quotes.list'=>[['id'=>'q1']],
        'invoices.list'=>[['id'=>'i1']],
        default=>[],
    };}
    public function act(string $o,array $c,array $p=[]):mixed{return [];}
});
$home=(new AggregatingCustomerOperationsGateway($r))->home(['company_id'=>'c1']);
hhpc(($home['jobs'][0]['id']??null)==='j1','home includes jobs');
hhpc(($home['bookings'][0]['id']??null)==='b1','home includes bookings');
hhpc(($home['quotes'][0]['id']??null)==='q1','home includes quotes');
hhpc(($home['invoices'][0]['id']??null)==='i1','home includes invoices');
