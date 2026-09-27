<?php
$root=realpath(__DIR__.'/../..');
require_once $root.'/System/Contracts/AppSurface.php';
require_once $root.'/System/Support/AppIdentity.php';
require_once $root.'/System/Support/AppContext.php';
require_once $root.'/System/Services/AppTrustedContextNormalizer.php';
use App\Extensions\TitanAppsCore\System\Services\AppTrustedContextNormalizer;

$n=new AppTrustedContextNormalizer();
$c=$n->normalize('zero',7,[7],9,'s1',['roles'=>['owner']]);
assert($c->companyId===7 && $c->actorId===9 && $c->surface->value==='zero');
try{$n->normalize('zero',7,[8],9);assert(false);}catch(InvalidArgumentException $e){assert($e->getMessage()==='app_context_company_conflict');}
echo "core_trusted_context_normalizer_contract: ok\n";
