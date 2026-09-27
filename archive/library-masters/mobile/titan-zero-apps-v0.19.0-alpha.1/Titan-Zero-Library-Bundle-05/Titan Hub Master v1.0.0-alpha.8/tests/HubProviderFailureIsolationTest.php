<?php
declare(strict_types=1);
$root=dirname(__DIR__);
require_once $root.'/System/Contracts/CustomerOperationsContributor.php';
require_once $root.'/System/Contracts/HubContributionRegistry.php';
require_once $root.'/System/Contracts/CustomerOperationsGateway.php';
require_once $root.'/System/Operations/InMemoryHubContributionRegistry.php';
require_once $root.'/System/Operations/AggregatingCustomerOperationsGateway.php';
use App\Extensions\TitanHub\System\Contracts\CustomerOperationsContributor;
use App\Extensions\TitanHub\System\Operations\InMemoryHubContributionRegistry;
use App\Extensions\TitanHub\System\Operations\AggregatingCustomerOperationsGateway;
function hpfi(bool $ok,string $message):void{if(!$ok){fwrite(STDERR,"FAIL: {$message}\n");exit(1);}echo "PASS: {$message}\n";}
$r=new InMemoryHubContributionRegistry();
$r->register(new class implements CustomerOperationsContributor{
 public function supports():array{return ['jobs.list','profile.read'];}
 public function read(string $o,array $c,array $a=[]):mixed{throw new RuntimeException('provider unavailable');}
 public function act(string $o,array $c,array $p=[]):mixed{throw new RuntimeException('provider unavailable');}
});
$r->register(new class implements CustomerOperationsContributor{
 public function supports():array{return ['jobs.list','profile.read'];}
 public function read(string $o,array $c,array $a=[]):mixed{return $o==='jobs.list'?[['id'=>'job-safe']]:['name'=>'Safe customer'];}
 public function act(string $o,array $c,array $p=[]):mixed{return [];}
});
$g=new AggregatingCustomerOperationsGateway($r);
$jobs=$g->jobs(['company_id'=>1,'customer_identity'=>'c']);
hpfi(($jobs[0]['id']??null)==='job-safe','failing read provider is isolated from healthy provider');
$profile=$g->profile(['company_id'=>1,'customer_identity'=>'c']);
hpfi(($profile['name']??null)==='Safe customer','failing merge provider is isolated from healthy provider');
