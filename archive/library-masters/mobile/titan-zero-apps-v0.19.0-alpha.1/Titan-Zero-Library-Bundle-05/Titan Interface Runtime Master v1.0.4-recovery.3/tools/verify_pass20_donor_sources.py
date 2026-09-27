#!/usr/bin/env python3
from __future__ import annotations
import hashlib, sys, zipfile
from pathlib import Path

expected={
 'menu(3).zip':('7098b206e64be3d9756b2cb4e058f4345317ff5c93cf6dab59b224f184e4b9f9',['parentMenuOrderUpdate','subMenuOrderUpdate','boltMenu','is_active']),
 'focus-mode(4).zip':('4017ee19d371dc1fccb2e5581c9a5e2ff85c7ad8023116bfe1b444ee47712f6c',['MenuService','ai_tools_list']),
 'announcement(7).zip':('fb21ad10c147607ef57f4ee98318e198fe3e84b9247bf9cd3ae8ed5d79f0ac89',['create_announcements_table','Announcement::create','Announcements']),
 'introductions(5).zip':('4e29001a2e4c3b22f6cdeb856564e5f51ea9c729ec48f5b2a1591ca170dfca89',['introJs','mark-tour-seen','tour_seen']),
 'onboarding-pro(3).zip':('9b64ec84fdeaa30d8b7549b7d7f62c067247a04561d9f9a1a8d8a8ffa06eb11b',['create_banner_table','create_survey_table','Shepherd','IntroductionStyle']),
}
paths=[Path(p) for p in sys.argv[1:]]
if len(paths)!=5: raise SystemExit('usage: verify_pass20_donor_sources.py <five donor zips>')
seen={}
for p in paths:
    h=hashlib.sha256(p.read_bytes()).hexdigest(); seen[p.name]=h
    if p.name not in expected: raise SystemExit(f'unexpected donor {p.name}')
    if h!=expected[p.name][0]: raise SystemExit(f'hash mismatch {p.name}: {h}')
    with zipfile.ZipFile(p) as z:
        corpus='\n'.join(z.namelist())+'\n'
        for n in z.namelist():
            if n.endswith(('.php','.blade.php','.js','.json')):
                try: corpus += z.read(n).decode('utf-8','ignore')+'\n'
                except Exception: pass
    for marker in expected[p.name][1]:
        if marker not in corpus: raise SystemExit(f'{p.name} missing audit marker {marker}')
print('PASS 20 DONOR SOURCES: exact five donor ZIP hashes and audited menu/focus/announcement/onboarding/introduction primitives verified')
