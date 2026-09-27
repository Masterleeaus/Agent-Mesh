#!/usr/bin/env python3
import json,sys
from pathlib import Path
root=Path(__file__).resolve().parents[2]
wf=json.loads((root/"workforce-integration.json").read_text())
errs=[]
def req(c,m):
    if not c: errs.append(m)
req(wf.get("schema_version") in ("1.3","1.4","1.5"),"schema_version must be 1.3 or 1.4")
req(wf.get("tenant_key")=="company_id","tenant key must be company_id")
ra=wf.get("runtime_adapter",{})
req(ra.get("scope_key")=="company_id","runtime adapter must be company scoped")
req(ra.get("fail_closed") is True,"runtime adapter must fail closed")
for field in ("class","runtime_contract_class","health_registry_class","capability_resolver_class","provider_selector_class"):
    req(isinstance(ra.get(field),str) and ra.get(field),"missing "+field)
expected = {
    "class":"PackageWorkforceProviderAdapter.php",
    "runtime_contract_class":"WorkforceProviderRuntimeContract.php",
    "health_registry_class":"ProviderHealthRegistry.php",
    "capability_resolver_class":"CapabilityResolver.php",
    "provider_selector_class":"ProviderSelector.php",
}
for field,fn in expected.items():
    req((root/"System"/"Workforce"/fn).is_file(), f"declared runtime class file missing: {fn}")
req((root/"System"/"Workforce"/"ProviderHealthSnapshot.php").is_file(),"health snapshot DTO missing")
req((root/"System"/"Workforce"/"CapabilityAvailability.php").is_file(),"capability availability DTO missing")
if errs:
    print("WORKFORCE_RUNTIME_ADAPTER_STRUCTURE_V13: FAIL")
    [print(" - "+e) for e in errs]
    sys.exit(1)
print("WORKFORCE_RUNTIME_ADAPTER_STRUCTURE_V13: PASS")
