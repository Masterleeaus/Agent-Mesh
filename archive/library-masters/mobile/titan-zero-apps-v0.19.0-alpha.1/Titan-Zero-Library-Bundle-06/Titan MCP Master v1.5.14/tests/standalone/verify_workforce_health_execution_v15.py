#!/usr/bin/env python3
import json,sys
from pathlib import Path
root=Path(__file__).resolve().parents[2]
wf=json.loads((root/"workforce-integration.json").read_text())
sp=(root/"System"/"TitanMcpServiceProvider.php").read_text()
errs=[]
def req(c,m):
    if not c: errs.append(m)
req(wf.get("schema_version")=="1.5","schema_version must be 1.5")
hx=wf.get("health_execution",{})
req(hx.get("scope_key")=="company_id","health execution must use company_id")
req(hx.get("secret_safe") is True,"health execution must be secret-safe")
req(hx.get("mutating_probe_forbidden") is True,"probe must be non-mutating")
req(hx.get("transition_event_required") is True,"availability transition events required")
req(hx.get("health_event_required") is True,"health observation events required")
req(hx.get("refresh_interval_seconds")==300,"health refresh interval must be 300 seconds")
for fn in ["ProviderHealthProbeContract.php","ProviderHealthProbe.php","ProviderHealthRefreshService.php","WorkforceProviderStatus.php","WorkforceProviderStatusService.php"]:
    req((root/"System"/"Workforce"/fn).is_file(),fn+" missing")
for token in ["ProviderHealthProbeContract::class","ProviderHealthRefreshService::class","WorkforceProviderStatusService::class"]:
    req(token in sp,"service provider missing "+token)
if errs:
    print("WORKFORCE_HEALTH_EXECUTION_V15: FAIL")
    [print(" - "+e) for e in errs]; sys.exit(1)
print("WORKFORCE_HEALTH_EXECUTION_V15: PASS")
