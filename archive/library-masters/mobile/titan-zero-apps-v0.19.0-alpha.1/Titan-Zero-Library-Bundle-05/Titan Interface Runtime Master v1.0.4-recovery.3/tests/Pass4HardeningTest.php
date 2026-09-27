<?php
require_once __DIR__.'/bootstrap.php';
require_once dirname(__DIR__).'/System/Contracts/InterfaceContribution.php';
require_once dirname(__DIR__).'/System/Contracts/InterfaceContributionRegistry.php';
require_once dirname(__DIR__).'/System/Contribution/ArrayInterfaceContribution.php';
require_once dirname(__DIR__).'/System/Registry/SemanticInterfaceContributionRegistry.php';
require_once dirname(__DIR__).'/System/Security/GeneratedSpecGuard.php';
use App\Extensions\TitanInterfaceRuntime\System\Contribution\ArrayInterfaceContribution;
use App\Extensions\TitanInterfaceRuntime\System\Registry\SemanticInterfaceContributionRegistry;
use App\Extensions\TitanInterfaceRuntime\System\Security\GeneratedSpecGuard;
function p4($x,$m){if(!$x){fwrite(STDERR,"FAIL $m\n");exit(1);}echo "PASS $m\n";}
$r=new SemanticInterfaceContributionRegistry();
$r->register(new ArrayInterfaceContribution('crm.customer.summary',['definition'=>['component'=>'titan.card']]));
try{$r->register(new ArrayInterfaceContribution('crm.customer.summary',['definition'=>['component'=>'titan.other']]));p4(false,'duplicate contribution rejected');}catch(DomainException){p4(true,'duplicate contribution rejected');}
$g=new GeneratedSpecGuard();
$children=[];for($i=0;$i<1001;$i++)$children[]=['component'=>'titan.text'];
try{$g->assertSafe(['component'=>'titan.stack','children'=>$children]);p4(false,'oversized interface rejected');}catch(InvalidArgumentException){p4(true,'oversized interface rejected');}
