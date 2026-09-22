#!/usr/bin/env python3
"""Execute deterministic Agent Mesh bridge operations after live GitHub validation."""
import argparse,hashlib,json,os,subprocess
from datetime import datetime,timezone
from pathlib import Path
from validate_execution_request import validate
def run(a,check=True):
 p=subprocess.run(a,text=True,capture_output=True)
 if check and p.returncode: raise RuntimeError((p.stderr or p.stdout or "command failed").strip())
 return p
def git_head(): return run(["git","rev-parse","HEAD"]).stdout.strip()
def inventory():
 files=[p.as_posix() for p in Path(".").rglob("*") if p.is_file() and ".git" not in p.parts]
 return {"file_count":len(files),"top_level":sorted({x.split("/",1)[0] for x in files})[:200]}
def verify():
 tests=["validate-agent-claim.py","claim-next-subgoal.py","audit-agent-claims.py","record-agent-continuation.py","validate-execution-request.py"]
 out=[]
 for name in tests:
  p=run(["python3",f".github/scripts/{name}","--self-test"],check=False);out.append({"script":name,"ok":p.returncode==0,"output":(p.stdout+p.stderr)[-2000:]})
 if not all(x["ok"] for x in out): raise RuntimeError("Agent Mesh verification failed")
 return {"tests":out}
def refresh_index():
 p=Path("roadmap/INDEX.json"); data=json.loads(p.read_text()); return {"index_present":True,"goal_count":len(data.get("goals",[])) if isinstance(data,dict) else None,"mutated":False}
def cleanup():
 empties=[]
 for p in sorted(Path(".").rglob("*"),reverse=True):
  if p.is_dir() and ".git" not in p.parts:
   try:
    if not any(p.iterdir()): empties.append(p.as_posix())
   except OSError: pass
 return {"empty_directories":empties,"mutated":False}
OPS={"verify.agent_mesh_ci":verify,"inventory.repository":inventory,"refresh.roadmap_index":refresh_index,"cleanup.empty_directories":cleanup}
def main():
 a=argparse.ArgumentParser();a.add_argument("--file",required=True);a.add_argument("--receipt",required=True);x=a.parse_args()
 raw=Path(x.file).read_bytes(); req=validate(json.loads(raw)); live=git_head()
 if live!=req["expected_head_sha"]: raise SystemExit(f"expected head {req['expected_head_sha']} but checkout is {live}")
 result=OPS[req["operation"]]()
 receipt={"schema":"titan-agent-mesh-execution-receipt/v1","request_sha256":hashlib.sha256(raw).hexdigest(),"subgoal_id":req["subgoal_id"],"claim_branch":req["claim_branch"],"validated_head_sha":live,"operation":req["operation"],"status":"SUCCEEDED","result":result,"authority":{"merge":False,"release_claim":False,"canonical_mutation":False},"recorded_at":datetime.now(timezone.utc).isoformat()}
 Path(x.receipt).parent.mkdir(parents=True,exist_ok=True);Path(x.receipt).write_text(json.dumps(receipt,indent=2)+"\n");print(json.dumps(receipt))
if __name__=="__main__":raise SystemExit(main())
