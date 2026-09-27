from pathlib import Path
import json, zipfile
root=Path(__file__).resolve().parents[1]
owners=json.loads((root/'registry/canonical-service-owners.json').read_text())
assert owners['tenant_boundary']=='company_id'
services={x['service']:x for x in owners['services']}
required=['crm','bookings','quotes','jobs_work_orders','invoicing','payments','communications','human_workforce','advanced_intelligence_workforce','knowledge','governance','providers_capabilities','reporting','quality_compliance','environmental_systems']
for k in required: assert k in services, k
assert services['environmental_systems']['status']=='UNRESOLVED_SOURCE_REQUIRED'
assert services['crm']['canonical_owner']=='Titan CRM'
assert services['jobs_work_orders']['canonical_owner']=='Titan Field'
assert services['communications']['canonical_owner']=='Titan Connect'
for p in (root/'providers').glob('*.zip'):
    with zipfile.ZipFile(p) as z:
        assert z.testzip() is None, p.name
print('PASS canonical owner registry')
print('PASS company_id tenant boundary')
print('PASS no fabricated environmental provider')
print('PASS provider ZIP integrity')
