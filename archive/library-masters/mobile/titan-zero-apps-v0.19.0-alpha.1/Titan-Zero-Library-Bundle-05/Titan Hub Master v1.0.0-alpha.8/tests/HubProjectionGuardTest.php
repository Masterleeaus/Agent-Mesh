<?php
require_once dirname(__DIR__).'/System/Security/HubProjectionGuard.php';
use App\Extensions\TitanHub\System\Security\HubProjectionGuard;
$g=new HubProjectionGuard();
$g->assertSafe(['customer'=>['name'=>'A'],'invoice'=>['total_minor'=>100]]);
try{$g->assertSafe(['customer'=>['password_hash'=>'x']]);fwrite(STDERR,"FAIL unsafe field accepted\n");exit(1);}catch(DomainException){echo "PASS projection guard rejects sensitive field\n";}
