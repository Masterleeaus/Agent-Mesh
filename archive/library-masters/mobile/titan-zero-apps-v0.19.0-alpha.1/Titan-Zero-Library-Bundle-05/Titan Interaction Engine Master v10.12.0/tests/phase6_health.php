<?php
declare(strict_types=1);
$root=dirname(__DIR__);$s=(string)file_get_contents($root.'/System/Monitoring/HealthCheck.php');$f=0;$c=function(bool$x,string$m)use(&$f){echo($x?'PASS ':'FAIL ').$m."\n";if(!$x)$f++;};
$c(str_contains($s,'CapabilityProviderRegistry'),'health inspects provider registry');
$c(str_contains($s,"'capability_providers'"),'health reports capability provider state');
$c(!str_contains($s,'field_services.onboarding.'),'health no longer assumes old onboarding capability namespace');
$c(str_contains($s,"'degraded'"),'health can report optional-provider degradation without core boot failure');
exit($f?1:0);
