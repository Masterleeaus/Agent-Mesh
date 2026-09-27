#!/usr/bin/env python3
"""Validate governed Agent Mesh execution requests. Never accepts shell/code payloads."""
import argparse,json,re
from pathlib import Path
SID=re.compile(r"^TZ-(?:G00|ROADMAP-\d+)-SG-\d+$"); SHA=re.compile(r"^[0-9a-f]{40}$",re.I); RID=re.compile(r"^[A-Za-z0-9._-]{8,120}$")
ALLOWED={"verify.agent_mesh_ci","inventory.repository","refresh.roadmap_index","cleanup.empty_directories"}
FORBIDDEN_KEYS={"command","commands","shell","script","code","exec","argv"}
def validate(p):
 if p.get("schema")!="titan-agent-mesh-execution-request/v1": raise ValueError("invalid schema")
 sid=str(p.get("subgoal_id") or ""); branch=str(p.get("claim_branch") or ""); rid=str(p.get("request_id") or ""); issue=int(p.get("issue_number") or 0)
 if not RID.match(rid) or issue < 1: raise ValueError("request_id and issue_number required")
 if not SID.match(sid) or branch!="agent/"+sid: raise ValueError("invalid work identity")
 if not SHA.match(str(p.get("expected_head_sha") or "")): raise ValueError("expected_head_sha required")
 op=str(p.get("operation") or "")
 if op not in ALLOWED: raise ValueError("operation not allowlisted")
 params=p.get("parameters") or {}
 if not isinstance(params,dict): raise ValueError("parameters must be object")
 bad=FORBIDDEN_KEYS.intersection(k.lower() for k in params)
 if bad: raise ValueError("arbitrary execution payload forbidden")
 if p.get("authority",{}).get("merge") or p.get("authority",{}).get("release_claim"): raise ValueError("request cannot grant merge/claim-release authority")
 return {"request_id":rid,"issue_number":issue,"subgoal_id":sid,"claim_branch":branch,"expected_head_sha":p["expected_head_sha"],"operation":op,"parameters":params}
def self_test():
 good={"schema":"titan-agent-mesh-execution-request/v1","request_id":"request-123","issue_number":734,"subgoal_id":"TZ-ROADMAP-55-SG-01","claim_branch":"agent/TZ-ROADMAP-55-SG-01","expected_head_sha":"a"*40,"operation":"inventory.repository","parameters":{}}
 assert validate(good)["operation"]=="inventory.repository"
 for bad in [{**good,"operation":"command.run"},{**good,"parameters":{"shell":"rm -rf ."}},{**good,"claim_branch":"agent/wrong"}]:
  try: validate(bad); raise AssertionError("expected rejection")
  except ValueError: pass
 print("validate-execution-request self-test OK")
def main():
 a=argparse.ArgumentParser();a.add_argument("--file");a.add_argument("--self-test",action="store_true");x=a.parse_args()
 if x.self_test:self_test();return 0
 if not x.file: raise SystemExit("--file required")
 print(json.dumps(validate(json.loads(Path(x.file).read_text(encoding="utf-8"))),sort_keys=True));return 0
if __name__=="__main__":raise SystemExit(main())
