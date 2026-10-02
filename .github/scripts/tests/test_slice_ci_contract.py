#!/usr/bin/env python3
"""Keep the routine PR gate scoped; broad suites run at the product milestone."""
from pathlib import Path
import unittest

ROOT = Path(__file__).resolve().parents[3]


class SliceCIGateTests(unittest.TestCase):
    def test_slice_check_runs_only_hygiene_and_claim_policy_tests(self):
        workflow = (ROOT / ".github/workflows/titan-ci.yml").read_text()
        start = workflow.index("  slice-check:")
        end = workflow.index("\n  mobile:", start)
        job = workflow[start:end]
        self.assertIn("git diff --check origin/main...HEAD", job)
        self.assertIn("test_validate_agent_claim.py", job)
        self.assertIn("test_slice_ci_contract.py", job)
        self.assertNotIn("--self-test", job)
        self.assertNotIn("pnpm gate", job)
        self.assertNotIn("flutter test", job)

    def test_broad_jobs_are_opt_in_at_subproduct_completion(self):
        workflow = (ROOT / ".github/workflows/titan-ci.yml").read_text()
        self.assertIn("contains(github.event.pull_request.body, '**Subproduct gate:** run')", workflow)
        self.assertIn("github.event_name == 'workflow_dispatch'", workflow)

    def test_candidate_policy_workflow_avoids_global_test_discovery(self):
        workflow = (ROOT / ".github/workflows/mission-evidence-tests.yml").read_text()
        self.assertIn("test_validate_agent_claim.py", workflow)
        self.assertIn("test_slice_ci_contract.py", workflow)
        self.assertNotIn("--self-test", workflow)


if __name__ == "__main__":
    unittest.main()
