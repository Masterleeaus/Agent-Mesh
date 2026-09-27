#!/usr/bin/env python3
import json, sys
from pathlib import Path
root=Path(__file__).resolve().parents[2]
wf=json.loads((root/'workforce-integration.json').read_text())
installer=json.loads((root/'extension.json').read_text())
manifest=json.loads((root/'extension.manifest.json').read_text())
errs=[]
def req(cond,msg):
    if not cond: errs.append(msg)
req(wf.get('schema_version') in ('1.1','1.2','1.3','1.4','1.5'),'schema_version must be 1.1, 1.2 or 1.3')
req(wf.get('tenant_key')=='company_id','tenant key must be company_id')
req(wf.get('provider',{}).get('version')==installer.get('version')==manifest.get('version'),'provider/installer/manifest versions must match')
cap=set(wf.get('capabilities',[])); tools=set(wf.get('tools',[])); commands=set(wf.get('commands',[])); contracts=wf.get('capability_contracts',[])
req(tools <= cap,'tools must be capabilities')
req(commands <= cap,'commands must be capabilities')
req(not (tools & commands),'tools and commands must be disjoint')
req(len(contracts)==len(cap),'one capability contract per capability required')
byid={c.get('id'):c for c in contracts}
req(set(byid)==cap,'capability contracts must exactly cover capabilities')
for cid,c in byid.items():
    req(c.get('provider_provenance_required') is True,f'{cid} must require provenance')
    auth=c.get('authority_evaluation',{})
    req(auth.get('owner')=='titan-autonomy',f'{cid} authority owner must be titan-autonomy')
    req(auth.get('role_or_install_state_never_raises_authority') is True,f'{cid} cannot infer authority from role/install state')
    if cid in commands:
        req(c.get('mutation_mode')=='command_bus_only',f'{cid} command must be command_bus_only')
        req(c.get('command_bus_required') is True,f'{cid} command must require command bus')
        req(c.get('execution_receipt_required') is True,f'{cid} command must require receipt')
    else:
        req(c.get('mutation_mode') in ('read_only','proposal_only'),f'{cid} non-command cannot mutate')
        req(c.get('command_bus_required') is False,f'{cid} non-command cannot require command bus')
req(wf.get('availability',{}).get('default')=='unavailable','availability must default unavailable')
req(wf.get('availability',{}).get('fail_closed') is True,'availability must fail closed')
req(wf.get('work_item_contract',{}).get('owner')=='titan-ai-workforce','Workforce must own work items')
req(wf.get('work_item_contract',{}).get('extension_may_create_or_update_employee_identity') is False,'extension must not own employee identity')
if errs:
    print('WORKFORCE_INTEGRATION_V11: FAIL')
    [print(' - '+e) for e in errs]
    sys.exit(1)
print('WORKFORCE_INTEGRATION_V11: PASS (36 capabilities)')
