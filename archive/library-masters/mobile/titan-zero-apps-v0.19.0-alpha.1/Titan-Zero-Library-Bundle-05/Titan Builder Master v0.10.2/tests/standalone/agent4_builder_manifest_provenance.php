<?php
require_once __DIR__.'/../../System/Contracts/BuilderContributionProvenance.php';
require_once __DIR__.'/../../System/Release/BuilderPackageManifestValidator.php';

use App\Extensions\TitanBuilder\System\Contracts\BuilderContributionProvenance;
use App\Extensions\TitanBuilder\System\Release\BuilderPackageManifestValidator;

$p=new BuilderContributionProvenance('crm','crm.pipeline','1.0','company-a');
if(($p->toArray()['company_id']??null)!=='company-a') throw new RuntimeException('company_id provenance failure');

$legacy=new BuilderContributionProvenance('crm','crm.pipeline','1.0',null,'company-a');
if(($legacy->toArray()['company_id']??null)!=='company-a') throw new RuntimeException('legacy tenant compatibility did not resolve to company_id');

try{
    new BuilderContributionProvenance('crm','crm.pipeline','1.0','company-a','company-b');
    throw new RuntimeException('conflicting tenant boundary accepted');
}catch(InvalidArgumentException $e){}

$m=json_decode(file_get_contents(__DIR__.'/../../extension.json'),true,512,JSON_THROW_ON_ERROR);
$r=(new BuilderPackageManifestValidator())->validate($m);
if(!$r['valid'] || $r['canonical_surfaces']!==['zero','go','hub']) throw new RuntimeException('manifest validation failure');

echo "BUILDER_MANIFEST_PROVENANCE_COMPANY_ID: PASS\n";
