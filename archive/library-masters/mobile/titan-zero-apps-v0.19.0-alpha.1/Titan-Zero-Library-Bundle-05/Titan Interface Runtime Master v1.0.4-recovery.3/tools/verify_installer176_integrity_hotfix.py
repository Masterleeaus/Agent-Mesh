#!/usr/bin/env python3
import hashlib, json, os, sys
from pathlib import Path
root=Path(__file__).resolve().parents[1]
manifest=json.loads((root/'extension.json').read_text())
declared=manifest.get('integrity',{}).get('files')
if not isinstance(declared,dict):
    raise SystemExit('FAIL: integrity.files must remain enabled')
actual={}
hidden=[]
for p in root.rglob('*'):
    if not p.is_file():
        continue
    rel=p.relative_to(root).as_posix()
    if rel=='extension.json':
        continue
    if any(part.startswith('.') for part in Path(rel).parts):
        hidden.append(rel)
        continue
    actual[rel]=hashlib.sha256(p.read_bytes()).hexdigest()
if hidden:
    raise SystemExit('FAIL: hidden package files remain: '+', '.join(sorted(hidden)))
if sorted(actual)!=sorted(declared):
    only_actual=sorted(set(actual)-set(declared))
    only_declared=sorted(set(declared)-set(actual))
    raise SystemExit(f'FAIL: file-list mismatch actual-only={only_actual} declared-only={only_declared}')
for path,digest in actual.items():
    if declared[path].lower()!=digest:
        raise SystemExit(f'FAIL: hash mismatch {path}')
print(f'PASS: Installer 1.7.6 live-style integrity list and hashes match ({len(actual)} files); no hidden files.')
