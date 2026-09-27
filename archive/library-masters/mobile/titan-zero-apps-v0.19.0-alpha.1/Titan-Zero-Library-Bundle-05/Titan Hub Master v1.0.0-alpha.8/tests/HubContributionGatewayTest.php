<?php
require_once dirname(__DIR__).'/System/Contracts/CustomerOperationsContributor.php';
require_once dirname(__DIR__).'/System/Contracts/HubContributionRegistry.php';
require_once dirname(__DIR__).'/System/Contracts/CustomerOperationsGateway.php';
require_once dirname(__DIR__).'/System/Operations/InMemoryHubContributionRegistry.php';
require_once dirname(__DIR__).'/System/Operations/AggregatingCustomerOperationsGateway.php';
use App\Extensions\TitanHub\System\Contracts\CustomerOperationsContributor;
use App\Extensions\TitanHub\System\Operations\InMemoryHubContributionRegistry;
use App\Extensions\TitanHub\System\Operations\AggregatingCustomerOperationsGateway;
$r=new InMemoryHubContributionRegistry();
$r->register(new class implements CustomerOperationsContributor{public function supports():array{return ['jobs.list','service_requests.create'];}public function read(string $o,array $c,array $a=[]):mixed{return $o==='jobs.list'?[['id'=>'job-1']]:[];}public function act(string $o,array $c,array $p=[]):mixed{return ['status'=>'accepted','receipt_id'=>'r1'];}});
$g=new AggregatingCustomerOperationsGateway($r);
if(($g->jobs([])[0]['id']??null)!=='job-1'){fwrite(STDERR,"FAIL contribution read\n");exit(1);}echo "PASS contribution read\n";
if(($g->createServiceRequest([],['description'=>'x'])['status']??null)!=='accepted'){fwrite(STDERR,"FAIL governed action\n");exit(1);}echo "PASS governed action\n";
