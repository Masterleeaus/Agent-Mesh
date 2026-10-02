"""Keep repository guidance aligned with the single existing claim gate."""
import json
from pathlib import Path
import re
import sys
import unittest
from datetime import datetime, timezone

ROOT = Path(__file__).resolve().parents[3]
sys.path.insert(0, str(ROOT / '.github' / 'scripts'))
from claim_recovery import stale_claim_blockers


class GovernanceContractTests(unittest.TestCase):
    def test_both_pr_templates_are_identical_and_start_nonclosing(self):
        upper = (ROOT / '.github/PULL_REQUEST_TEMPLATE.md').read_text()
        lower = (ROOT / '.github/pull_request_template.md').read_text()
        self.assertEqual(upper, lower)
        self.assertIn('**Linked issue:** Refs #', upper)
        self.assertIn('agent/issue-<issue-number>', upper)
        blocks = re.findall(r'```mission-evidence\n(.*?)\n```', upper, re.S)
        self.assertEqual(len(blocks), 1)
        evidence = json.loads(blocks[0])
        self.assertEqual(evidence['mode'], 'partial')
        self.assertTrue(evidence['human_review_required'])
        self.assertEqual(evidence['live_host']['status'], 'unknown')
        self.assertTrue(evidence['remaining_work'])

    def test_contracts_link_to_single_evidence_format(self):
        for path in ('AGENTS.md', 'docs/agent/MISSION_TEMPLATE.md'):
            content = (ROOT / path).read_text()
            self.assertIn('MISSION_CLOSURE_EVIDENCE.md', content)
            self.assertIn('Refs', content)
            self.assertIn('Closes', content)
        contract = (ROOT / 'docs/agent/MISSION_CLOSURE_EVIDENCE.md').read_text()
        for required in ('Planning/specification', 'Implementation', 'Integration',
                         'Certification', 'Mandatory human review', 'Premature closure',
                         'SUPERSEDED', 'september-28-plugin-mission.json'):
            self.assertIn(required, contract)

    def test_stale_claim_recovery_is_bounded_and_multi_issue_work_is_serialized(self):
        contract = (ROOT / 'AGENTS.md').read_text()
        claim_rules = contract.split('## 5. GitHub claim and branch discipline', 1)[1].split('## 6.', 1)[0]
        for required in ('at least one hour', 'no open PR', 'no commits ahead of current `main`',
                         'reuse the exact branch', 'durable takeover comment',
                         '.github/scripts/claim_recovery.py',
                         'Never force-reset', 'multiple claims may be held sequentially',
                         'only one branch may be checked out or written'):
            self.assertIn(required, claim_rules)
        self.assertIn('It does not relax human review, required checks, tenant isolation', contract)
        self.assertIn('only after full completion', contract)
        mission_template = (ROOT / 'docs/agent/MISSION_TEMPLATE.md').read_text()
        self.assertIn('one-hour recovery procedure in root `AGENTS.md`', mission_template)
        self.assertIn('may proceed sequentially', mission_template)

    def test_stale_claim_eligibility_requires_all_fresh_facts(self):
        now = datetime(2026, 10, 3, 0, 0, tzinfo=timezone.utc)
        eligible = dict(now=now, issue_updated_at='2026-10-02T22:59:59Z',
                        issue_is_open=True, open_pr_uses_branch=False, ahead_by=0)
        self.assertEqual(stale_claim_blockers(**eligible), [])
        self.assertIn('issue-active-within-one-hour', stale_claim_blockers(
            **{**eligible, 'issue_updated_at': '2026-10-02T23:00:01Z'}))
        self.assertIn('open-pr-uses-claim-branch', stale_claim_blockers(
            **{**eligible, 'open_pr_uses_branch': True}))
        self.assertIn('claim-branch-has-unique-commits', stale_claim_blockers(
            **{**eligible, 'ahead_by': 1}))
        self.assertIn('pr-active-within-one-hour', stale_claim_blockers(
            **{**eligible, 'latest_pr_activity_at': '2026-10-02T23:30:00Z'}))
        self.assertIn('issue-not-open', stale_claim_blockers(
            **{**eligible, 'issue_is_open': False}))

    def test_trusted_workflow_does_not_execute_candidate_code(self):
        workflow = (ROOT / '.github/workflows/agent-claim-gate.yml').read_text()
        self.assertIn('name: Mission Closure Evidence Gate', workflow)
        self.assertIn('pull_request_target:', workflow)
        self.assertNotRegex(workflow, r'(?m)^  pull_request:')
        self.assertIn('ref: ${{ github.event.pull_request.base.sha || github.sha }}', workflow)
        self.assertIn('persist-credentials: false', workflow)
        self.assertNotIn('secrets.', workflow)
        self.assertNotRegex(workflow, r'(?m)^\s+(contents|issues|pull-requests): write')
        self.assertNotIn('pull_request.head', workflow)
        self.assertNotIn('download-artifact', workflow)

    def test_candidate_workflow_has_no_privileged_trigger_or_token(self):
        workflow = (ROOT / '.github/workflows/mission-evidence-tests.yml').read_text()
        self.assertIn('pull_request:', workflow)
        self.assertNotIn('pull_request_target', workflow)
        self.assertNotIn('secrets.', workflow)
        self.assertNotIn('GH_TOKEN', workflow)
        self.assertIn('persist-credentials: false', workflow)
        self.assertIn('contents: read', workflow)
        self.assertIn('validate-agent-claim.py --self-test', workflow)


if __name__ == '__main__':
    unittest.main()
