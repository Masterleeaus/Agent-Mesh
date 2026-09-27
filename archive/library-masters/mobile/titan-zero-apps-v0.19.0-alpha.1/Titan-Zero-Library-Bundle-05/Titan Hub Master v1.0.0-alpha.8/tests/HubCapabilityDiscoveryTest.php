<?php
declare(strict_types=1);
require_once dirname(__DIR__).'/System/Contracts/CustomerOperationsContributor.php';
require_once dirname(__DIR__).'/System/Contracts/HubContributionRegistry.php';
require_once dirname(__DIR__).'/System/Operations/InMemoryHubContributionRegistry.php';
require_once dirname(__DIR__).'/System/Integration/HubCapabilityDiscovery.php';
use App\Extensions\TitanHub\System\Contracts\CustomerOperationsContributor;
use App\Extensions\TitanHub\System\Operations\InMemoryHubContributionRegistry;
use App\Extensions\TitanHub\System\Integration\HubCapabilityDiscovery;
function hcd(bool $ok,string $message):void{if(!$ok){fwrite(STDERR,"FAIL: {$message}\n");exit(1);}echo "PASS: {$message}\n";}
$r=new InMemoryHubContributionRegistry();
$r->register(new class implements CustomerOperationsContributor{
    public function supports():array{return ['services.list','service_requests.create','support.list','profile.read','quotes.list'];}
    public function read(string $o,array $c,array $a=[]):mixed{return [];}
    public function act(string $o,array $c,array $p=[]):mixed{return [];}
});
$d=new HubCapabilityDiscovery($r);
$report=$d->report();
hcd(($report['workspaces']['book']['available']??false)===true,'book available when service read and request action exist');
hcd(($report['workspaces']['inbox']['available']??false)===true,'inbox follows support contribution');
hcd(($report['workspaces']['more']['available']??false)===true,'more follows profile contribution');
hcd(($report['actions']['hub.service-request.create']??false)===true,'governed service request action exposed');
hcd(($report['actions']['hub.quote.approve']??true)===false,'missing quote approval not advertised');
hcd(($report['reads']['hub.quotes.read']??false)===true,'quote read capability discovered');
