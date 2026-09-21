from pathlib import Path
import json
import hashlib

ROOT=Path(__file__).resolve().parents[1]
def text(path): return (ROOT/path).read_text(errors='ignore')

def test_manifest_uses_titan_shell_sidepanel_and_keeps_rich_chat_and_modules():
    manifest=json.loads(text('manifest.json'))
    assert manifest['version']=='0.18.2'
    assert manifest['side_panel']['default_path']=='sidePanel.html'
    assert (ROOT/'module-view.html').exists()
    assert (ROOT/'titan-modules/module-host.mjs').exists()

def test_native_titan_sidepanel_has_business_modules_and_work_views():
    src=text('sidePanel.html')
    for token in ['titan-business-view','modules.html','diagnostics.html','titan-work-frame','Titan Zero']:
        assert token in src
    assert 'titan-zero-chat-content.compat.js' not in src
    assert (ROOT/'titan-zero-chat-content.compat.js').exists()

def test_rebrand_compat_runtime_and_retriever_bridge_are_present():
    for path in [
        'titan-zero-chat-content.compat.js','titan-zero-chat-background.compat.js',
        'titan-zero-chat-runtime.compat.js','titan-zero-chat-runtime.html',
        'side-panel/titan-retriever-bridge.js','README-TITAN-REBRAND.md'
    ]:
        assert (ROOT/path).exists(), path

def test_workforce_assets_contracts_and_donor_provenance_equivalence_are_preserved():
    for path in [
        'README-TITAN-WORKFORCE.md','titan-workforce.js','titan-client-workforce.js',
        'titan-cleaning-workforce.js','workforce/PROVENANCE.json',
        'workforce/contracts/WorkerDecisionPacket.schema.json',
        'titan-workforce/catalogue/installed-client-workforce-master.json',
        'titan-provenance/external-provenance-index.json'
    ]:
        assert (ROOT/path).exists(), path
    canonical=ROOT/'titan-workforce/catalogue/installed-client-workforce-master.json'
    canonical_sha=hashlib.sha256(canonical.read_bytes()).hexdigest()
    index=json.loads(text('titan-provenance/external-provenance-index.json'))
    donor=next((r for r in index['references'] if r['original_path']=='workforce/donor/installed-client-workforce-master.json'),None)
    assert donor is not None
    assert donor['sha256']==canonical_sha
    assert donor['logical_locator']==f'provenance://sha256/{canonical_sha}'
    assert donor['runtime_packaged'] is False

def test_company_id_remains_only_company_boundary_in_new_shell_and_workforce():
    corpus='\n'.join(text(p) for p in ['sidePanel.html','titan-shell.js','README-TITAN-WORKFORCE.md'])
    assert 'company_id' in corpus
    assert 'tenant_company_id' not in corpus
