#!/usr/bin/env python3
import json,sys
from pathlib import Path
root=Path(__file__).resolve().parents[2]
wf=json.loads((root/"workforce-integration.json").read_text())
sp=(root/"System"/"TitanMcpServiceProvider.php").read_text()
errs=[]
def req(c,m):
    if not c: errs.append(m)
req(wf.get("schema_version") in ("1.4","1.5"),"schema_version must be 1.4 or 1.5")
hr=wf.get("host_registration",{})
req(hr.get("scope_key")=="company_id","host registration must use company_id")
req(hr.get("persistent_store")=="laravel_cache","persistent store must be laravel_cache")
req(hr.get("registration_key")=="titan.workforce.providers","registration key mismatch")
req(hr.get("fail_closed") is True,"host registration must fail closed")
for fn in ["ProviderHealthStoreContract.php","LaravelCacheProviderHealthStore.php","WorkforceProviderContribution.php","WorkforceProviderEventEmitter.php"]:
    req((root/"System"/"Workforce"/fn).is_file(),fn+" missing")
for token in ["WorkforceProviderContribution::class","titan.workforce.providers","ProviderHealthStoreContract::class","WorkforceProviderEventEmitter::class"]:
    req(token in sp,"service provider missing "+token)
if errs:
    print("WORKFORCE_HOST_REGISTRATION_V14: FAIL")
    [print(" - "+e) for e in errs]; sys.exit(1)
print("WORKFORCE_HOST_REGISTRATION_V14: PASS")
