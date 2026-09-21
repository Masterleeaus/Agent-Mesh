from pathlib import Path
import hashlib
import json

ROOT = Path(__file__).resolve().parents[1]


def text(path):
    return (ROOT / path).read_text(errors='ignore')


def sha(path):
    return hashlib.sha256((ROOT / path).read_bytes()).hexdigest()


def test_background_bootstrap_uses_titan_compatibility_boundary_only():
    src = text('background-bootstrap.js')
    assert "import './compatibility/monica/background-runtime-boundary.mjs';" in src
    assert "import './titan-zero-chat-background.compat.js';" not in src
    assert "import './retriever-background.iife.js';" not in src
    assert '__TITAN_COMPATIBILITY_BACKGROUND__' in src


def test_boundary_is_static_mv3_and_explicitly_non_authoritative():
    src = text('compatibility/monica/background-runtime-boundary.mjs')
    assert "import '../../titan-zero-chat-background.compat.js';" in src
    assert "import '../../retriever-background.iife.js';" in src
    assert "protocol:'titan.compatibility.background.v1'" in src
    assert "company_boundary:'company_id'" in src
    assert 'compatibility_not_authority:true' in src
    assert 'grants_authority:false' in src
    assert 'authority_effect:false' in src
    assert 'direct_mutation_authority:false' in src
    assert 'import(' not in src
    assert 'eval(' not in src
    assert 'new Function' not in src


def test_legacy_background_engines_have_one_active_import_boundary():
    code_files = [p for p in ROOT.rglob('*') if p.is_file() and p.suffix in {'.js','.mjs'}]
    retriever_refs=[]
    chat_refs=[]
    for p in code_files:
        relative=p.relative_to(ROOT)
        rel=relative.as_posix()
        if 'tests' in relative.parts:
            continue
        s=p.read_text(errors='ignore')
        # Count executable static import boundaries, not descriptive/runtime-registry strings.
        if "import '../../retriever-background.iife.js';" in s or "import './retriever-background.iife.js';" in s:
            retriever_refs.append(rel)
        if "import '../../titan-zero-chat-background.compat.js';" in s or "import './titan-zero-chat-background.compat.js';" in s:
            chat_refs.append(rel)
    assert retriever_refs == ['compatibility/monica/background-runtime-boundary.mjs']
    assert chat_refs == ['compatibility/monica/background-runtime-boundary.mjs']


def test_p2_008_compiled_compatibility_bytes_remain_preserved_during_p0_ui_recovery():
    # TZ-WP-004 supersedes the old assumption that sidePanel.html and titan-shell.js
    # must remain byte-identical forever. Their pre-recovery hashes remain frozen in
    # the Pass 1 preservation baseline while the P0 packet is allowed to restore
    # reachability surgically. Compiled compatibility runtimes remain protected except for explicitly verified Chrome-load defect repairs.
    expected = {
        'titan-zero-chat-background.compat.js': 'ebbd0843eb12d0413af6aa13603be2b365aa702304df2f74b87e4951a3f9a805',
        'retriever-background.iife.js': '080267be826d81fc9ff1061b24fc2ee92cff37fe4d08dfe5d6d5eba2f2d14ce9',
        'titan-zero-chat-content.compat.js': '987c0de84d020c8484fb1cc7da81a69346e1bd940f7b72874d8ffa82fbfe6ab8',
        'titan-zero-chat-content.compat.css': 'bac75be20e6f66f1ea5291141a2067157687a764012c5fc8478ce6191f9e464c',
    }
    assert {path: sha(path) for path in expected} == expected

    manifest = json.loads(text('manifest.json'))
    assert manifest['background'] == {'service_worker': 'background-bootstrap.js', 'type': 'module'}
    assert manifest['side_panel']['default_path'] == 'sidePanel.html'
    assert manifest['action']['default_popup'] == 'titan-popup.html'
    assert manifest['options_ui'] == {'page': 'monicaOptions.html', 'open_in_tab': True}
    assert '_execute_action' in manifest['commands']
    assert 'run-monica-on-new-tab' in manifest['commands']

    baseline = json.loads(text('titan-regression/monica-retriever/FEATURE-PRESERVATION-BASELINE.json'))
    assert any(item.get('canonical_path') == 'sidePanel.html' for item in baseline['comparison']['different_files'])
    assert 'data-view="business"' in text('sidePanel.html')
    assert 'data-view="workforce"' in text('sidePanel.html')
    assert 'data-view="chat"' in text('sidePanel.html')
    assert 'side-panel/index.html' in text('sidePanel.html')
    assert (ROOT/'monicaOptions.html').exists()
    assert (ROOT/'chatTab.html').exists()
