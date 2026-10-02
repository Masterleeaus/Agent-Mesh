"""Keep repository guidance aligned with the single existing claim gate."""
import json
from pathlib import Path
import re
import subprocess
import sys
import unittest

ROOT = Path(__file__).resolve().parents[3]


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

    def test_evidence_ledger_ownership_inventory_is_complete_and_gated(self):
        script = ROOT / '.github/scripts/check-evidence-ledger-ownership.py'
        result = subprocess.run([sys.executable, str(script)], cwd=ROOT, text=True, capture_output=True)
        self.assertEqual(result.returncode, 0, result.stdout + result.stderr)
        workflow = (ROOT / '.github/workflows/titan-ci.yml').read_text()
        self.assertIn('check-evidence-ledger-ownership.py', workflow)
        contract = (ROOT / 'docs/contracts/accepted-evidence-ledger.md').read_text()
        self.assertIn('evidence-ledger-ownership.json', contract)


if __name__ == '__main__':
    unittest.main()
