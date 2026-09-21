#!/usr/bin/env python3
import json, argparse
from pathlib import Path

STATES={'PROPOSED','PARTIAL','IMPLEMENTED','VERIFIED','BLOCKED','SUPERSEDED'}

def load(p): return json.loads(Path(p).read_text())

def choose_next(tasks):
    by_id={t['task_id']:t for t in tasks}
    def eligible(t):
        if t.get('status') in {'VERIFIED','SUPERSEDED','BLOCKED'}: return False
        if t.get('claim',{}).get('status')!='UNCLAIMED': return False
        return all(by_id.get(d,{'status':'VERIFIED'}).get('status')=='VERIFIED' for d in t.get('dependencies',[]))
    e=[t for t in tasks if eligible(t)]
    return sorted(e,key=lambda t:(-int(t.get('priority',0)),t['task_id']))[0] if e else None

def impacted(graph, changed):
    rev={}
    for e in graph.get('edges',[]):
        if e.get('type')=='DEPENDS_ON': rev.setdefault(e['to'],set()).add(e['from'])
    seen=set(changed); q=list(changed)
    while q:
        x=q.pop(0)
        for y in rev.get(x,set()):
            if y not in seen: seen.add(y); q.append(y)
    return sorted(seen-set(changed))

def can_mark_verified(evidence, builder_id):
    passes=[e for e in evidence if e.get('result')=='PASS']
    return any(e.get('producer_role') in {'VERIFIER','MANAGER'} and e.get('producer_id')!=builder_id for e in passes)

def summary(capdoc):
    caps=capdoc.get('capabilities',[])
    counts={s:0 for s in sorted(STATES)}
    for c in caps: counts[c.get('status','PROPOSED')]=counts.get(c.get('status','PROPOSED'),0)+1
    return {'capabilities':len(caps),'status_counts':counts,'ids':[c['capability_id'] for c in caps]}

def main():
    ap=argparse.ArgumentParser(); sp=ap.add_subparsers(dest='cmd',required=True)
    a=sp.add_parser('next'); a.add_argument('tasks')
    a=sp.add_parser('impact'); a.add_argument('graph'); a.add_argument('changed',nargs='+')
    a=sp.add_parser('summary'); a.add_argument('capabilities')
    ns=ap.parse_args()
    if ns.cmd=='next': out=choose_next(load(ns.tasks).get('tasks',[]))
    elif ns.cmd=='impact': out=impacted(load(ns.graph),ns.changed)
    else: out=summary(load(ns.capabilities))
    print(json.dumps(out,indent=2))
if __name__=='__main__': main()
