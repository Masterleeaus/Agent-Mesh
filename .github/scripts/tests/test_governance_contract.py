"""Keep repository guidance aligned with the single existing claim gate."""
import json
import importlib.util
from pathlib import Path
import re
import subprocess
import sys
import tempfile
import unittest

ROOT = Path(__file__).resolve().parents[3]


class GovernanceContractTests(unittest.TestCase):
    def test_both_pr_templates_are_identical_and_start_nonclosing(self):
        upper = (ROOT / '.github/PULL_REQUEST_TEMPLATE.md').read_text()
        lower = (ROOT / '.github/pull_request_template.md').read_text()
        self.assertEqual(upper, lower)
        self.assertIn('**Linked issue:** Refs #', upper)
        self.assertNotIn('Required mission claim: exactly', upper)
        self.assertIn('Focused commands and actual results', upper)
        self.assertIn('does not need a full parent-criteria map', upper)
        self.assertIn('For a PR that closes an issue', upper)
        self.assertNotRegex(upper, r'```mission-evidence')

    def test_titan_ci_defers_broad_gates_to_product_milestone(self):
        workflow = (ROOT / '.github/workflows/titan-ci.yml').read_text()
        self.assertIn('slice-check:', workflow)
        self.assertIn("github.event_name == 'workflow_dispatch'", workflow)
        self.assertIn('Run broad integration', (ROOT / 'AGENTS.md').read_text())

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
        self.assertIn('ref: main', workflow)
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
        inventory = json.loads((ROOT / 'docs/contracts/evidence-ledger-ownership.json').read_text())
        allowed = set(inventory['primary_roles'])
        self.assertEqual(len(allowed), 7)
        self.assertTrue(all(row['role'] in allowed and row.get('role_detail') for row in inventory['inventory']))
        self.assertEqual([row['path'] for row in inventory['inventory'] if row['role'] == 'accepted-factual-business-evidence-ledger'], [inventory['accepted_factual_owner']])

    def test_evidence_guard_discovers_durable_writer_without_ledger_filename(self):
        script = ROOT / '.github/scripts/check-evidence-ledger-ownership.py'
        spec = importlib.util.spec_from_file_location('evidence_ownership_guard', script)
        guard = importlib.util.module_from_spec(spec)
        spec.loader.exec_module(guard)
        with tempfile.TemporaryDirectory() as temp_dir:
            root = Path(temp_dir)
            writer = root / 'services/workforce/evidence-store.ts'
            writer.parent.mkdir(parents=True)
            writer.write_text('await db.query("INSERT INTO accepted_evidence (id) VALUES (?)")')
            fact_writer = root / 'services/workforce/outcome-store.ts'
            fact_writer.write_text('await db.query("INSERT INTO business_facts (id) VALUES (?)")')
            history_writer = root / 'apps/web/status-history.ts'
            history_writer.parent.mkdir(parents=True)
            history_writer.write_text('await db.query("INSERT INTO status_history (id) VALUES (?)")')
            recovery_writer = root / 'packages/recovery-store.mjs'
            recovery_writer.parent.mkdir(parents=True)
            recovery_writer.write_text('await db.query("INSERT INTO execution_lifecycle_events (id) VALUES (?)")')
            ui = root / 'apps/web/status-form.tsx'
            ui.write_text('// Update status after save')
            builder = root / 'packages/evidence-presentation.ts'
            builder.parent.mkdir(parents=True, exist_ok=True)
            builder.write_text('export function buildEvidenceView(input) { return input }')
            found = guard.active_evidence_sources(root)
        self.assertIn('services/workforce/evidence-store.ts', found)
        self.assertIn('services/workforce/outcome-store.ts', found)
        self.assertIn('apps/web/status-history.ts', found)
        self.assertIn('packages/recovery-store.mjs', found)
        self.assertNotIn('apps/web/status-form.tsx', found)
        self.assertNotIn('packages/evidence-presentation.ts', found)


if __name__ == '__main__':
    unittest.main()
