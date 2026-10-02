"""Keep repository guidance aligned with the claim-recovery policy."""
import json
from pathlib import Path
import re
import sys
import unittest
from datetime import datetime, timedelta, timezone
from types import SimpleNamespace
from unittest.mock import patch

ROOT = Path(__file__).resolve().parents[3]
sys.path.insert(0, str(ROOT / '.github' / 'scripts'))
from claim_recovery import reserve_same_ref, stale_claim_blockers


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

    def test_stale_recovery_contract_preserves_review_and_completion_gates(self):
        contract = (ROOT / 'AGENTS.md').read_text()
        claim_rules = contract.split('## 5. GitHub claim and branch discipline', 1)[1].split('## 6.', 1)[0]
        for required in ('within five minutes', 'last hour',
                         'any open PR using the exact ref', 'any branch commit ahead of current `main`',
                         'Do not discard existing commits or PRs',
                         'unique empty reservation commit', 'normal non-forced Git semantics',
                         'rejected', 'durable takeover comment',
                         '.github/scripts/claim_recovery.py',
                         'multiple claims may be held sequentially',
                         'only one branch may be checked out or written'):
            self.assertIn(required, claim_rules)
        self.assertIn('It does not relax human review, required checks, tenant isolation', contract)
        self.assertIn('only after full completion', contract)
        mission_template = (ROOT / 'docs/agent/MISSION_TEMPLATE.md').read_text()
        self.assertIn('every activity source', mission_template)
        self.assertIn('normal non-forced push', mission_template)
        self.assertIn('may proceed sequentially', mission_template)

    @staticmethod
    def make_snapshot(now):
        observed = now - timedelta(minutes=1)
        quiet = now - timedelta(hours=2)
        stamp = lambda value: value.isoformat().replace('+00:00', 'Z')
        return {
            'observed_at': stamp(observed),
            'issue': {'observed_at': stamp(observed), 'state': 'open', 'updated_at': stamp(quiet)},
            'issue_comments': {'observed_at': stamp(observed), 'complete': True, 'updated_at': []},
            'owner_status_updates': {'observed_at': stamp(observed), 'complete': True, 'updated_at': []},
            'pull_requests': [],
            'pull_requests_complete': True,
            'branch': {'observed_at': stamp(observed), 'complete': True, 'head_sha': 'a' * 40,
                       'observed_head_sha': 'a' * 40, 'ahead_of_main_count': 0},
            'main': {'observed_at': stamp(observed), 'complete': True, 'head_sha': 'c' * 40},
            'repository_push_events': {'observed_at': stamp(observed), 'complete': True,
                                       'covered_since': stamp(now - timedelta(hours=2)),
                                       'events': [{'ref': 'refs/heads/agent/issue-1255',
                                                   'created_at': stamp(quiet)}]},
            'workflow_runs': {'observed_at': stamp(observed), 'complete': True,
                              'covered_since': stamp(now - timedelta(hours=2)),
                              'updated_at': [], 'statuses': []},
        }

    def test_complete_quiet_snapshot_allows_same_ref_continuation(self):
        now = datetime(2026, 10, 3, 0, 0, tzinfo=timezone.utc)
        self.assertEqual(stale_claim_blockers(now=now, branch_name='agent/issue-1255',
                                              activity_snapshot=self.make_snapshot(now)), [])

    def test_missing_source_stale_snapshot_and_changed_head_fail_closed(self):
        now = datetime(2026, 10, 3, 0, 0, tzinfo=timezone.utc)
        snapshot = self.make_snapshot(now)
        del snapshot['owner_status_updates']
        blockers = stale_claim_blockers(now=now, branch_name='agent/issue-1255', activity_snapshot=snapshot)
        self.assertIn('missing-activity-source:owner_status_updates', blockers)
        snapshot = self.make_snapshot(now)
        snapshot['observed_at'] = '2026-10-02T23:00:00Z'
        self.assertIn('activity-snapshot-not-fresh', stale_claim_blockers(
            now=now, branch_name='agent/issue-1255', activity_snapshot=snapshot))
        snapshot = self.make_snapshot(now)
        snapshot['branch']['observed_head_sha'] = 'b' * 40
        self.assertIn('claim-branch-head-changed-during-snapshot', stale_claim_blockers(
            now=now, branch_name='agent/issue-1255', activity_snapshot=snapshot))

    def test_each_activity_stream_restarts_quiet_window(self):
        now = datetime(2026, 10, 3, 0, 0, tzinfo=timezone.utc)
        recent = '2026-10-02T23:30:00Z'
        cases = [
            ('issue', 'updated_at', recent, 'issue-active-within-one-hour'),
            ('issue_comments', 'updated_at', [recent], 'activity-within-one-hour:issue_comments.updated_at'),
            ('owner_status_updates', 'updated_at', [recent], 'activity-within-one-hour:owner_status_updates.updated_at'),
            ('workflow_runs', 'updated_at', [recent], 'activity-within-one-hour:workflow_runs.updated_at'),
        ]
        for source, key, value, expected in cases:
            with self.subTest(source=source):
                snapshot = self.make_snapshot(now)
                snapshot[source][key] = value
                self.assertIn(expected, stale_claim_blockers(
                    now=now, branch_name='agent/issue-1255',
                    activity_snapshot=snapshot))
        snapshot = self.make_snapshot(now)
        snapshot['repository_push_events']['events'] = [{
            'ref': 'refs/heads/agent/issue-1255', 'created_at': recent}]
        self.assertIn('activity-within-one-hour:repository_push_events.events', stale_claim_blockers(
            now=now, branch_name='agent/issue-1255', activity_snapshot=snapshot))

    def test_open_pr_or_unique_commits_block_takeover(self):
        now = datetime(2026, 10, 3, 0, 0, tzinfo=timezone.utc)
        snapshot = self.make_snapshot(now)
        observed = snapshot['observed_at']
        snapshot['pull_requests'] = [{
            'observed_at': observed, 'complete': True, 'state': 'open', 'head_ref': 'agent/issue-1255',
            'head_sha': 'a' * 40, 'base_ref': 'main',
            'updated_at': ['2026-10-02T22:00:00Z'], 'comment_updated_at': [],
            'review_updated_at': [], 'review_comment_updated_at': [],
        }]
        self.assertIn('open-pr-uses-claim-branch', stale_claim_blockers(
            now=now, branch_name='agent/issue-1255', activity_snapshot=snapshot))
        snapshot = self.make_snapshot(now)
        snapshot['branch']['ahead_of_main_count'] = 1
        self.assertIn('claim-branch-has-unique-commits', stale_claim_blockers(
            now=now, branch_name='agent/issue-1255', activity_snapshot=snapshot))

    def test_active_workflow_and_recent_pr_review_block_continuation(self):
        now = datetime(2026, 10, 3, 0, 0, tzinfo=timezone.utc)
        snapshot = self.make_snapshot(now)
        snapshot['workflow_runs']['statuses'] = ['in_progress']
        self.assertIn('relevant-workflow-active', stale_claim_blockers(
            now=now, branch_name='agent/issue-1255', activity_snapshot=snapshot))
        snapshot['workflow_runs']['statuses'] = []
        snapshot['pull_requests'] = [{
            'observed_at': snapshot['observed_at'], 'complete': True, 'state': 'open',
            'head_ref': 'agent/issue-1255', 'head_sha': 'a' * 40, 'base_ref': 'main',
            'updated_at': ['2026-10-02T22:00:00Z'], 'comment_updated_at': [],
            'review_updated_at': ['2026-10-02T23:30:00Z'], 'review_comment_updated_at': [],
        }]
        self.assertIn('activity-within-one-hour:pull_requests[0].review_updated_at', stale_claim_blockers(
            now=now, branch_name='agent/issue-1255', activity_snapshot=snapshot))

    def test_ref_reservation_is_nonforced_compare_and_swap(self):
        head = 'a' * 40
        reservation = 'b' * 40
        outputs = [
            SimpleNamespace(returncode=0, stdout=f'{head}\trefs/heads/agent/issue-1255\n'),
            SimpleNamespace(returncode=0, stdout=''),
            SimpleNamespace(returncode=0, stdout='ok'),
        ]
        with patch('claim_recovery.subprocess.run', side_effect=outputs) as run:
            reserve_same_ref(branch_name='agent/issue-1255', observed_head=head,
                             reservation_commit=reservation)
        push = run.call_args_list[-1].args[0]
        self.assertEqual(push, ['git', 'push', '--porcelain', 'origin',
                                f'{reservation}:refs/heads/agent/issue-1255'])
        self.assertNotIn('--force', push)

    def test_ref_move_or_rejected_push_means_contender_stops(self):
        head = 'a' * 40
        reservation = 'b' * 40
        moved = SimpleNamespace(returncode=0, stdout=f'{"c" * 40}\trefs/heads/agent/issue-1255\n')
        with patch('claim_recovery.subprocess.run', return_value=moved) as run:
            with self.assertRaisesRegex(RuntimeError, 'ref moved'):
                reserve_same_ref(branch_name='agent/issue-1255', observed_head=head,
                                 reservation_commit=reservation)
        self.assertEqual(run.call_count, 1)
        outputs = [
            SimpleNamespace(returncode=0, stdout=f'{head}\trefs/heads/agent/issue-1255\n'),
            SimpleNamespace(returncode=0, stdout=''),
            SimpleNamespace(returncode=1, stdout='', stderr='non-fast-forward'),
        ]
        with patch('claim_recovery.subprocess.run', side_effect=outputs):
            with self.assertRaisesRegex(RuntimeError, 'reservation lost'):
                reserve_same_ref(branch_name='agent/issue-1255', observed_head=head,
                                 reservation_commit=reservation)

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
