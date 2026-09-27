<?php
require_once dirname(__DIR__).'/System/Contracts/ActionIntentDispatcher.php';
require_once dirname(__DIR__).'/System/Actions/ActionAsIntent.php';
use App\Extensions\TitanInterfaceRuntime\System\Contracts\ActionIntentDispatcher;
use App\Extensions\TitanInterfaceRuntime\System\Actions\ActionAsIntent;
class D implements ActionIntentDispatcher{public function dispatch(array $intent):array{return ['status'=>'queued','intent'=>$intent];}}
$a=new ActionAsIntent(new D());
try{$a->invoke('crm.customer.update',['company_id'=>99]);fwrite(STDERR,"FAIL client authority accepted\n");exit(1);}catch(InvalidArgumentException){echo "PASS client authority rejected\n";}
$r=$a->invoke('crm.customer.update',['name'=>'A'],['company_id'=>1]);if(($r['status']??'')!=='queued'){exit(1);}echo "PASS trusted context remains dispatcher context\n";
