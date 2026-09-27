<?php

declare(strict_types=1);
$root=$argv[1]??'';$dir=rtrim($root,'/').'/app/Extensions/TitanBuilder/resources/builder/data-sources';
if(!is_dir($dir)){fwrite(STDERR,"usage: php verify_pass18_builder_surfaces.php /path/to/website-root\n");exit(2);}
$expected=[
 'crm-owner-finance-summary.json'=>['owner','crm.owner.dashboard'],
 'crm-field-assigned-work.json'=>['field','crm.field.offline'],
 'crm-customer-invoices.json'=>['customer','crm.customer.operations'],
];
foreach($expected as$file=>[$surface,$capability]){
 $p=$dir.'/'.$file;if(!is_file($p))throw new RuntimeException("Builder surface data source missing {$file}");
 $d=json_decode((string)file_get_contents($p),true,512,JSON_THROW_ON_ERROR);
 if(($d['read_only']??false)!==true)throw new RuntimeException("{$file} must remain read-only");
 if(!in_array($surface,(array)($d['surface_compatibility']??[]),true))throw new RuntimeException("{$file} surface compatibility changed");
 if(($d['required_capability']??null)!==$capability)throw new RuntimeException("{$file} required capability changed");
}
echo "PASS 18 BUILDER SURFACES: owner/field/customer read models remain explicitly surface-scoped and capability-gated\n";
