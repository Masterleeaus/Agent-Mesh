#!/usr/bin/env python3
import json,sys
from pathlib import Path
root=Path(__file__).resolve().parents[2]
wf=json.loads((root/"workforce-integration.json").read_text())
errs=[]
def req(c,m):
    if not c: errs.append(m)
req(wf.get("schema_version") in ("1.2","1.3","1.4","1.5"),"schema_version must be 1.2 or 1.3")
req(wf.get("tenant_key")=="company_id","tenant key must be company_id")
rd=wf.get("runtime_discovery",{})
rh=wf.get("runtime_health",{})
ca=wf.get("capability_availability",{})
ev=wf.get("runtime_events",{})
req(rd.get("discovery_owner")=="titan-ai-workforce","Workforce must own discovery")
req(rd.get("scope_key")=="company_id","discovery must be company scoped")
req(rd.get("install_state_never_implies_availability") is True,"install state cannot imply availability")
req(rd.get("duplicate_provider_resolution")=="blocked_until_pinned","duplicate providers must fail closed")
req(rh.get("default_state")=="unavailable","health must default unavailable")
req(rh.get("probe_is_non_mutating") is True,"health probe must be non-mutating")
req(rh.get("probe_requires_company_scope") is True,"health probe must require company scope")
req(rh.get("credential_probe_redacts_secrets") is True,"credential probes must redact secrets")
req(isinstance(rh.get("stale_after_seconds"),int) and rh["stale_after_seconds"]>0,"health TTL required")
req(rh.get("recovery_requires_fresh_probe") is True,"recovery must require fresh probe")
req(ca.get("default")=="unavailable" and ca.get("fail_closed") is True,"capability availability must fail closed")
req(ca.get("authority_never_inferred_from_health") is True,"health cannot grant authority")
req(ca.get("health_never_inferred_from_install_state") is True,"install cannot imply health")
for en in ("availability_changed","health_observed"):
    e=ev.get(en,{})
    req("company_id" in e.get("required_fields",[]),f"{en} must carry company_id")
    req(e.get("secret_fields_forbidden") is True,f"{en} must forbid secrets")
if errs:
    print("WORKFORCE_RUNTIME_DISCOVERY_V12: FAIL")
    [print(" - "+e) for e in errs]
    sys.exit(1)
print("WORKFORCE_RUNTIME_DISCOVERY_V12: PASS")
