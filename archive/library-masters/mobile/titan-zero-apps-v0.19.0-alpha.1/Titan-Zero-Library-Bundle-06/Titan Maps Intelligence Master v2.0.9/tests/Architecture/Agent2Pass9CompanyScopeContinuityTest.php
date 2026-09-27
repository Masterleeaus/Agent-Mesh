<?php
declare(strict_types=1);
$root=dirname(__DIR__,2);$fail=[];
$assert=function(bool $ok,string $m)use(&$fail){if(!$ok)$fail[]=$m;};
$manifest=json_decode((string)@file_get_contents($root.'/resources/titan-apps/interface-contributions.json'),true);
foreach((array)($manifest['contributions']??[]) as $c){
  $assert(array_diff((array)($c['supported_surfaces']??[]),['zero','go','hub'])===[],'non-canonical surface in contribution');
  $assert(!array_key_exists('tenant_id',$c)&&!array_key_exists('tenant_company_id',$c),'contribution exposes legacy tenant boundary');
}
$provider=basename($root);
if(str_starts_with($provider,'Titan-CRM-')){
  $owner=(string)file_get_contents($root.'/System/Integrations/TitanMobile/CrmOwnerActionGateway.php');
  $dash=(string)file_get_contents($root.'/System/Integrations/TitanMobile/CrmOwnerDashboardGateway.php');
  $hub=(string)file_get_contents($root.'/System/Integrations/TitanMobile/CrmCustomerOperationsGateway.php');
  $assert(str_contains($owner,"sourceSurface:'zero'")&&!str_contains($owner,"sourceSurface:'owner'"),'owner adapter must normalize to zero');
  $assert(str_contains($dash,"sourceSurface: 'zero'")&&!str_contains($dash,"sourceSurface: 'owner'"),'dashboard adapter must normalize to zero');
  $assert(str_contains($hub,"sourceSurface: 'hub'")&&!str_contains($hub,"sourceSurface: 'customer'"),'customer adapter must normalize to hub');
  foreach([
    'System/Services/CrmViewDataService.php',
    'System/Services/CrmInvoiceSettlementReferenceService.php',
    'System/Services/CrmMergeService.php',
    'System/Services/LeadQualificationService.php',
    'System/Services/DefaultSalesPipelineProvisioner.php',
    'System/Services/CrmReceivablesService.php',
    'System/Services/LeadLifecycleService.php',
  ] as $f){$src=(string)file_get_contents($root.'/'.$f);$assert(str_contains($src,'company_id'),'CRM hardened path must carry company_id: '.$f);}
}
if(str_starts_with($provider,'Titan-Field-')){
  $a=(string)file_get_contents($root.'/System/Domains/FieldServices/Scheduling/AppointmentService.php');
  $r=(string)file_get_contents($root.'/System/Domains/FieldServices/Routing/RouteService.php');
  $assert(str_contains($a,"where('company_id',\$tenant)->where('id',\$row->id)"),'appointment follow-up mutation/read must keep company_id');
  $assert(str_contains($r,"where('company_id',\$tenantId)->where('id',\$stop->id)"),'route-stop follow-up mutation/read must keep company_id');
}
if(str_starts_with($provider,'Titan-Bookings-Quotes-')){
  $b=(string)file_get_contents($root.'/System/Runtime/DatabaseBookingAssignmentPort.php');
  $assert(substr_count($b,"where('company_id',\$companyId)->where('id',\$b->id)")>=2,'booking assignment follow-up write/read must keep company_id');
}
if($fail){fwrite(STDERR,implode("\n",$fail)."\n");exit(1);}fwrite(STDOUT,"Agent2 Pass9 scope-continuity PASS\n");
