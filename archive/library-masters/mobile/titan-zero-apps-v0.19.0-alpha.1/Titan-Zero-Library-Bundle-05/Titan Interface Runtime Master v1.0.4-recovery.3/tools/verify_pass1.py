#!/usr/bin/env python3
from __future__ import annotations
from pathlib import Path
import json, re, sys

ROOT = Path(__file__).resolve().parents[1]
errors: list[str] = []

def fail(message: str) -> None:
    errors.append(message)

# Host install manifest (Titan installer 1.7.8 contract subset used by this package).
host = json.loads((ROOT / 'extension.json').read_text(encoding='utf-8'))
required = ['schema', 'slug', 'version', 'folder', 'provider']
for key in required:
    if not isinstance(host.get(key), str) or not host[key].strip():
        fail(f'host extension.json missing valid {key}')
if host.get('schema') != 'titan-extension-v1':
    fail('host extension.json schema must be titan-extension-v1')
if not re.fullmatch(r'[a-z0-9]+(?:-[a-z0-9]+)*', str(host.get('slug', ''))):
    fail('invalid host slug')
if not re.fullmatch(r'[A-Za-z][A-Za-z0-9_]*', str(host.get('folder', ''))):
    fail('invalid host folder')
if not re.fullmatch(r'\d+\.\d+\.\d+(?:[-+][0-9A-Za-z.-]+)?', str(host.get('version', ''))):
    fail('invalid host semver')
expected_prefix = f"App\\Extensions\\{host.get('folder')}\\"
if not str(host.get('provider', '')).startswith(expected_prefix):
    fail('host provider is outside extension folder namespace')
provider_rel = str(host.get('provider', '')).removeprefix(expected_prefix).replace('\\', '/') + '.php'
if not (ROOT / provider_rel).is_file():
    fail(f'host provider file missing: {provider_rel}')

# Blueprint v4.1 sidecar invariants.
side = json.loads((ROOT / 'extension.manifest.json').read_text(encoding='utf-8'))
if side.get('schema_version') not in ('2.1', '2.2'):
    fail('Blueprint sidecar must use supported schema 2.1/2.2')
profile = side.get('architecture', {}).get('profile') if side.get('schema_version') == '2.2' else side.get('runtime_profile')
if profile not in ('titan-ui', 'ui-surface'):
    fail('runtime profile must be titan-ui/ui-surface')
if side.get('key') != host.get('slug'):
    fail('host slug and Blueprint key differ')
for field in ('version', 'folder', 'provider'):
    if side.get(field) != host.get(field):
        fail(f'host/Blueprint {field} differs')
db = side.get('database', {})
if db.get('migrations') is not False or db.get('owned_tables'):
    fail('Pass 1 must own no business tables or migrations')
if any(table != 'menus' for table in (db.get('shared_tables') or [])):
    fail('only host navigation metadata table menus may be shared')
if side.get('authorization', {}).get('ai_mutations_via_capabilities') is not True:
    fail('mutating UI actions must be governed via capabilities')
iface_decl = side.get('interface_contribution', {})
if iface_decl.get('enabled') is not True or iface_decl.get('contract_version') not in ('1.0','1.1'):
    fail('interface runtime must expose a supported Interface Contribution Contract')

iface = json.loads((ROOT / 'resources/interface/interface-manifest.json').read_text(encoding='utf-8'))
if iface.get('extension_key') != host.get('slug'):
    fail('interface extension_key differs from host slug')
if iface.get('objects') != [] or iface.get('actions') != [] or iface.get('lifecycles') != []:
    fail('Pass 1 runtime self-contribution must not publish business objects/actions/lifecycles')
for domain in iface.get('domains', []):
    if domain.get('layer') != 'platform':
        fail('Pass 1 self-contribution may publish platform domains only')

# Source boundary: no concrete cross-extension imports and no direct business persistence.
source_files = list((ROOT / 'System').rglob('*.php')) + list((ROOT / 'routes').rglob('*.php'))
for path in source_files:
    text = path.read_text(encoding='utf-8')
    for match in re.finditer(r'^use App\\Extensions\\([^\\;]+)\\([^;]+);', text, flags=re.M):
        if match.group(1) != 'TitanInterfaceRuntime':
            fail(f'concrete cross-extension import: {path.relative_to(ROOT)}: {match.group(0)}')
    rel = path.relative_to(ROOT).as_posix()
    for pattern in [
        r'use Illuminate\\Support\\Facades\\DB;',
        r'use Illuminate\\Database\\Eloquent\\Model;',
        r'DB::table\s*\(',
        r'::(?:create|updateOrCreate|firstOrCreate|upsert)\s*\(',
    ]:
        if re.search(pattern, text):
            fail(f'direct persistence pattern {pattern}: {path.relative_to(ROOT)}')
    write_pattern = r'->(?:insert|insertGetId|upsert|update|save|saveOrFail)\s*\('
    if rel != 'System/Host/TitanHostMenuCompatibilityAdapter.php' and re.search(write_pattern, text):
        fail(f'direct persistence pattern {write_pattern}: {path.relative_to(ROOT)}')


# Template leftovers are never allowed in an artifact.
for path in ROOT.rglob('*'):
    if not path.is_file():
        continue
    try:
        text = path.read_text(encoding='utf-8')
    except UnicodeDecodeError:
        continue
    if re.search(r'\{\{[A-Z_][A-Z_]*\}\}', text):
        fail(f'unresolved Blueprint placeholder: {path.relative_to(ROOT)}')

if errors:
    for error in errors:
        print('ERROR:', error, file=sys.stderr)
    raise SystemExit(1)

print('OK: Titan Interface Runtime Pass 1 host + architecture verification')
print(f'OK: {len(source_files)} runtime PHP source files scanned')
