#!/usr/bin/env python3
"""Persist Agent Mesh continuation receipts after validating live GitHub authority."""
import argparse,json,os,re,subprocess
from datetime import datetime,timezone
from pathlib import Path
SID_RE=re.compile(r"^TZ-(?:G00|ROADMAP-\d+)-SG-\d+$"); SHA_RE=re.compile(r"^[0-9a-f]{40}$",re.I)
def run(a):
 p=subprocess.run(a,text=True,capture_output=True)
 if p.returncode: raise RuntimeError((p.stderr or p.stdout or "command failed").strip())
 return p
def jr(a): return json.loads(run(a).stdout or "null")
def repo_name(): return os.environ.get("GITHUB_REPOSITORY") or run(["gh","repo","view","--json","nameWithOwner","--jq",".nameWithOwner"]).stdout.strip()
def live(repo,sid):
 branch=f"agent/{sid}"; ref=jr(["gh","api",f"repos/{repo}/git/ref/heads/{branch}"])
 issues=jr(["gh","issue","list","--repo",repo,"--state","open","--limit","1000","--json","number,title,url"]) or []
 issue=next((x for x in issues if (x.get("title") or "").startswith(f"[{sid}]")),None)
 if not issue: raise ValueError(f"no open issue for {sid}")
 cmp=jr(["gh","api",f"repos/{repo}/compare/main...{branch}"])
 return {"issue":issue,"branch":branch,"head_sha":((ref or {}).get("object") or {}).get("sha"),"merge_base_sha":((cmp.get("merge_base_commit") or {}).get("sha"),),"ahead_by":int(cmp.get("ahead_by") or 0),"behind_by":int(cmp.get("behind_by") or 0)}
def validate(p,s):
 sid=str(p.get("subgoal_id") or "")
 if not SID_RE.match(sid): raise ValueError("invalid subgoal_id")
 if p.get("claim_branch")!=s["branch"]: raise ValueError("noncanonical claim branch")
 h=p.get("head_sha")
 if h and (not SHA_RE.match(str(h)) or h!=s["head_sha"]): raise ValueError("checkpoint head SHA differs from live claim head")
 if int(p.get("issue_number") or 0)!=int(s["issue"]["number"]): raise ValueError("issue mismatch")
 return sid
def persist(repo,s,p,kind):
 sid=p["subgoal_id"]; marker=f"<!-- agent-mesh-continuation:{sid} -->"
 safe={**p,"kind":kind,"validated_against":{"issue_number":s["issue"]["number"],"claim_branch":s["branch"],"head_sha":s["head_sha"],"ahead_by":s["ahead_by"],"behind_by":s["behind_by"]},"authority":{"durable_development_truth":"github","claim":"git-branch-ref","continuation":"recovery-context-only","claim_released":False,"may_merge":False},"recorded_at":datetime.now(timezone.utc).isoformat()}
 body=marker+"\n### Agent Mesh continuation checkpoint\n\n"+json.dumps(safe,indent=2,sort_keys=True)
 comments=jr(["gh","api","--paginate",f"repos/{repo}/issues/{s['issue']['number']}/comments"]) or []
 old=next((x for x in comments if marker in (x.get("body") or "")),None)
 if old: out=jr(["gh","api","--method","PATCH",f"repos/{repo}/issues/comments/{old['id']}","-f",f"body={body}"]); action="updated"
 else: out=jr(["gh","api","--method","POST",f"repos/{repo}/issues/{s['issue']['number']}/comments","-f",f"body={body}"]); action="created"
 return {"action":action,"comment_id":out.get("id"),"issue_number":s["issue"]["number"],"subgoal_id":sid,"claim_branch":s["branch"],"head_sha":s["head_sha"],"kind":kind}
def self_test():
 s={"issue":{"number":7},"branch":"agent/TZ-ROADMAP-55-SG-01","head_sha":"a"*40}; p={"issue_number":7,"subgoal_id":"TZ-ROADMAP-55-SG-01","claim_branch":s["branch"],"head_sha":"a"*40}
 assert validate(p,s)=="TZ-ROADMAP-55-SG-01"
 try: validate({**p,"claim_branch":"agent/wrong"},s); raise AssertionError("expected failure")
 except ValueError: pass
 print("record-agent-continuation self-test OK")
def main():
 ap=argparse.ArgumentParser();ap.add_argument("--file");ap.add_argument("--kind",choices=["checkpoint","takeover"],default="checkpoint");ap.add_argument("--self-test",action="store_true");a=ap.parse_args()
 if a.self_test:self_test();return 0
 if not a.file: raise SystemExit("--file required")
 p=json.loads(Path(a.file).read_text(encoding="utf-8")); repo=repo_name(); sid=str(p.get("subgoal_id") or ""); s=live(repo,sid); validate(p,s)
 if a.kind=="takeover" and not p.get("to_execution_session"): raise SystemExit("takeover requires to_execution_session")
 print(json.dumps(persist(repo,s,p,a.kind),indent=2)); return 0
if __name__=="__main__": raise SystemExit(main())
