<?php
require __DIR__.'/bootstrap.php';
use App\Extensions\TitanInterfaceRuntime\System\Registry\SemanticInterfaceContributionRegistry; use App\Extensions\TitanInterfaceRuntime\System\Contribution\ArrayInterfaceContribution;
$r=new SemanticInterfaceContributionRegistry(); $r->register(new ArrayInterfaceContribution('crm.customer.summary',['owner_extension'=>'crm'])); ok($r->find('crm.customer.summary')!==null,'platform contribution registered through public contract');
