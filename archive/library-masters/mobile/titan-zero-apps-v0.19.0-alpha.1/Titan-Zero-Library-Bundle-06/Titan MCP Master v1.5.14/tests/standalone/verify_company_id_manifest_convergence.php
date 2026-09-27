<?php

declare(strict_types=1);
$root=dirname(__DIR__,2);
$manifest=json_decode((string)file_get_contents($root.'/extension.manifest.json'),true,512,JSON_THROW_ON_ERROR);
$errors=[];
$walk=function(mixed $value,string $path='') use (&$walk,&$errors): void {
    if (is_array($value)) {
        foreach ($value as $key=>$item) {
            $p=$path===''?(string)$key:$path.'.'.$key;
            if (is_string($item)) {
                $authoritative = in_array($p,['data.tenant_key','data_governance.tenant_key'],true)
                    || (str_contains($p,'idempotency') && (str_starts_with($item,'company_id+') || str_starts_with($item,'tenant_company_id+')))
                    || (str_starts_with($p,'rewind_sources.') && str_ends_with($p,'.tenant_key'));
                if ($authoritative && ($item==='tenant_company_id' || str_starts_with($item,'tenant_company_id+'))) {
                    $errors[]=$p.'='.$item;
                }
            }
            $walk($item,$p);
        }
    }
};
$walk($manifest);
if ($errors!==[]) { fwrite(STDERR,'authoritative manifest still uses legacy tenant_company_id key: '.implode(', ',$errors).PHP_EOL); exit(1); }
echo "company-id-manifest-convergence: PASS\n";
