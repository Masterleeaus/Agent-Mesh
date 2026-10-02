"""Behavior tests for the existing claim gate; GitHub I/O is the only fake."""
import contextlib
import copy
import hashlib
import importlib.util
import io
import json
import os
from pathlib import Path
import subprocess
import tempfile
import unittest
from unittest.mock import patch

SCRIPT = Path(__file__).resolve().parents[1] / 'validate-agent-claim.py'
spec = importlib.util.spec_from_file_location('claim_gate', SCRIPT)
gate = importlib.util.module_from_spec(spec)
spec.loader.exec_module(gate)
FIXTURES = Path(__file__).with_name('fixtures')
ISSUE = json.loads((FIXTURES / 'september-28-plugin-mission.json').read_text())
SHA = 'a' * 40
REPO = 'fixture/repo'


def record(mode='complete'):
    requirements = ['Install the plugin on the commissioned Business Node.',
                    'Project governed state without becoming a parallel runtime.',
                    'Observe a real plugin operation and retain verified evidence.',
                    'The installed plugin passes live-host certification.']
    return {'version': 1, 'issue': 1168, 'mode': mode,
            'issue_body_sha256': hashlib.sha256(ISSUE['body'].encode()).hexdigest(),
            'criteria': [{'criterion': text, 'implementation': ['apps/directadmin/plugin.ts'],
                          'checks': ['live-certification']} for text in requirements],
            'checks': [{'id': 'live-certification', 'command': 'certify-plugin --host commissioned',
                        'result': 'passed', 'evidence': 'https://github.com/fixture/repo/actions/runs/123',
                        'required': True, 'kind': 'live-host'}],
            'live_host': {'status': 'passed', 'reason': 'Commissioned host certification executed.'},
            'remaining_work': [] if mode == 'complete' else ['Install and certify the actual plugin.'],
            'human_review_required': True}


def body(evidence=None, relation='Closes'):
    evidence = record() if evidence is None else evidence
    return f'''## Titan Zero Agent / Codex PR
**Linked issue:** {relation} #1168
**Subgoal ID:** N/A (mission issue)
**Claim branch:** agent/issue-1168
### Outcome
Installed and verified plugin.
### Files changed
apps/directadmin/plugin.ts
### Verification
See check records.
### Architecture / authority
Existing runtime remains canonical.
### Completion evidence
```mission-evidence
{json.dumps(evidence)}
```
### Risk / compatibility / rollback
Revert plugin package; preserve recorded evidence.
'''


class GateTests(unittest.TestCase):
    def run_gate(self, description=None, *, head='agent/issue-1168', issue=None,
                 claim_sha=SHA, pr_sha=SHA, ancestry='ahead', others=None, repo=REPO, title='Enforce mission evidence', commits=None, closing_links=None, commit_count=None, issue_after=None):
        pr = {'number': 42, 'title': title,
              'body': body() if description is None else description,
              'head': {'ref': head, 'sha': pr_sha, 'repo': {'full_name': repo}},
              'base': {'ref': 'main'}, 'changed_files': 0, 'commits': len(commits or []) if commit_count is None else commit_count}
        self.calls = []
        def response(args):
            self.calls.append(args)
            endpoint = next((arg for arg in args if arg.startswith('repos/')), '')
            if args[:3] == ['gh', 'api', 'graphql']:
                return {'data': {'repository': {'pullRequest': {'closingIssuesReferences': {
                    'nodes': closing_links or [], 'pageInfo': {'hasNextPage': False, 'endCursor': None}}}}}}
            if '/pulls/42/files' in endpoint:
                return []
            if '/pulls/42/commits' in endpoint:
                return commits or []
            if '/pulls/42' in endpoint:
                return pr
            if '/git/ref/heads/main' in endpoint:
                return {'object': {'sha': SHA}}
            if '/git/ref/' in endpoint:
                return {'object': {'sha': claim_sha}}
            if '/issues/' in endpoint:
                if issue_after is not None and sum(any('/issues/' in arg for arg in call) for call in self.calls) > 1:
                    return issue_after
                return ISSUE if issue is None else issue
            if args[:3] == ['gh', 'pr', 'list'] or '/pulls?' in endpoint:
                return [] if others is None else others
            raise AssertionError(f'Unexpected GitHub call: {args}')
        with tempfile.TemporaryDirectory() as folder:
            event = Path(folder) / 'event.json'
            event.write_text(json.dumps({'pull_request': pr}))
            with patch.dict(os.environ, {'GITHUB_EVENT_PATH': str(event), 'GITHUB_REPOSITORY': REPO, 'GH_TOKEN': 'fixture'}), \
                 patch.object(gate, 'validate_roadmap_integrity', return_value={}), \
                 patch.object(gate, 'run_json', side_effect=response), \
                 patch.object(gate.subprocess, 'run', return_value=subprocess.CompletedProcess([], 0, ancestry, '')), \
                 contextlib.redirect_stdout(io.StringIO()), contextlib.redirect_stderr(io.StringIO()):
                gate.validate_pull_request()

    def rejected(self, description=None, **kwargs):
        with self.assertRaises(SystemExit) as error:
            self.run_gate(description, **kwargs)
        self.assertEqual(error.exception.code, 1)

    def test_partial_slice_needs_no_claim_branch_or_completion_template(self):
        self.run_gate('Small code slice with focused verification.', head='feature/storage-bridge')

    def test_complete_mapping_passes(self):
        self.run_gate()

    def test_september_28_partial_projection_cannot_close(self):
        evidence = record('partial')
        evidence['criteria'] = evidence['criteria'][1:2]
        self.rejected(body(evidence))

    def test_september_28_partial_projection_can_reference(self):
        evidence = record('partial')
        evidence['criteria'] = evidence['criteria'][1:2]
        evidence['checks'][0]['result'] = 'not-run'
        evidence['live_host']['status'] = 'not-run'
        self.run_gate(body(evidence, 'Refs'))

    def test_every_acceptance_and_done_item_is_required(self):
        evidence = record()
        evidence['criteria'].pop()
        self.rejected(body(evidence))

    def test_issue_changed_during_validation_cannot_pass(self):
        self.rejected(issue_after=dict(ISSUE, body=ISSUE['body'] + 'A new constraint.'))

    def test_stale_issue_snapshot_fails(self):
        changed = dict(ISSUE, body=ISSUE['body'] + '\nNew mandatory constraint.\n')
        self.rejected(issue=changed)

    def test_empty_or_placeholder_implementation_fails(self):
        for value in ([], ['TBD'], ['<path>']):
            evidence = record()
            evidence['criteria'][0]['implementation'] = value
            self.rejected(body(evidence))

    def test_unknown_check_and_duplicate_criterion_fail(self):
        evidence = record()
        evidence['criteria'][0]['checks'] = ['missing']
        self.rejected(body(evidence))
        evidence = record()
        evidence['criteria'].append(evidence['criteria'][0])
        self.rejected(body(evidence))

    def test_failed_blocked_unknown_unrun_checks_cannot_close(self):
        for status in ('failed', 'blocked', 'unknown', 'not-run'):
            evidence = record()
            evidence['checks'][0]['result'] = status
            self.rejected(body(evidence))

    def test_live_host_unknown_unrun_cannot_close(self):
        for status in ('unknown', 'not-run', 'blocked'):
            evidence = record()
            evidence['live_host']['status'] = status
            self.rejected(body(evidence))

    def test_remaining_work_and_missing_human_review_fail(self):
        evidence = record()
        evidence['remaining_work'] = ['Implementation is pending.']
        self.rejected(body(evidence))
        evidence = record()
        evidence['human_review_required'] = False
        self.rejected(body(evidence))

    def test_multiple_or_cross_repository_closures_fail(self):
        for extra in ('Fixes #1170', 'Resolves other/repo#1168',
                      'CLOSES https://github.com/other/repo/issues/1168',
                      'Closes #1168, #1170', 'Fixes\n#1170', 'Closes:#1170', 'Closes #1168,\n#1170'):
            self.rejected(body() + '\n' + extra)

    def test_refs_cannot_hide_closing_keyword(self):
        self.rejected(body(record('partial'), 'Refs') + '\nFixes #1168')

    def test_wrong_link_or_cross_repository_closure_fails(self):
        self.rejected(body().replace('Closes #1168', 'Closes #1169'))
        self.rejected(repo='other/fork')

    def test_partial_slice_is_not_blocked_by_branch_or_base_drift(self):
        self.run_gate(body(record('partial'), 'Refs'), head='feature/slice',
                      claim_sha='b' * 40, pr_sha='', ancestry='diverged')

    def test_closed_issue_or_pr_is_not_a_mission(self):
        self.rejected(issue=dict(ISSUE, state='closed'))
        self.rejected(issue=dict(ISSUE, pull_request={}))

    def test_partial_slice_is_not_blocked_by_another_open_pr(self):
        self.run_gate(body(record('partial'), 'Refs'),
                      others=[{'number': 43, 'head': {'ref': 'feature/other'}, 'body': 'Refs #1168'}])

    def test_placeholder_check_evidence_and_empty_sections_fail(self):
        evidence = record()
        evidence['checks'][0]['evidence'] = 'TODO'
        self.rejected(body(evidence))
        self.rejected(body().replace('Installed and verified plugin.', ''))

    def test_malformed_or_duplicate_evidence_blocks_fail(self):
        self.rejected(body().replace('"version": 1', '"version": 2'))
        self.rejected(body() + '\n```mission-evidence\n{}\n```')

    def test_title_commit_and_manual_link_cannot_hide_closure(self):
        partial = body(record('partial'), 'Refs')
        self.rejected(partial, title='Fixes #1168')
        self.rejected(partial, commits=[{'commit': {'message': 'Fixes #1168'}}])
        self.rejected(partial, closing_links=[{'number': 1168, 'repository': {'nameWithOwner': REPO}}])
        self.rejected('Routine change', head='feature/other', commits=[{'commit': {'message': 'Closes #1168'}}])
        self.rejected('Routine change', head='feature/other', closing_links=[{'number': 1168, 'repository': {'nameWithOwner': REPO}}])

    def test_common_heading_formats_cannot_omit_acceptance(self):
        for heading in ('Acceptance Criteria:', 'Acceptance criteria (required)', '**Acceptance criteria**'):
            issue = dict(ISSUE, body=f'## {heading}\n- Install actual plugin.\n\n## Verification\n- Run unit tests.\n')
            evidence = record()
            evidence['issue_body_sha256'] = hashlib.sha256(issue['body'].encode()).hexdigest()
            evidence['criteria'] = [dict(evidence['criteria'][0], criterion='Run unit tests.')]
            self.rejected(body(evidence), issue=issue)

    def test_verification_only_is_not_a_parseable_mission(self):
        issue = dict(ISSUE, body='## Verification\n- Run unit tests.\n')
        evidence = record()
        evidence['issue_body_sha256'] = hashlib.sha256(issue['body'].encode()).hexdigest()
        evidence['criteria'] = [dict(evidence['criteria'][0], criterion='Run unit tests.')]
        self.rejected(body(evidence), issue=issue)

    def test_candidate_roadmap_blob_is_validated_as_data(self):
        candidate = {'changed_files': 1}
        import base64
        data = b'{"goal_id": "BROKEN", "subgoals": []}'
        sha = hashlib.sha1(b'blob ' + str(len(data)).encode() + b'\0' + data).hexdigest()
        changed = [{'filename': 'roadmap/goals/TZ-G00.json', 'status': 'modified', 'sha': sha}]
        bad_goal = base64.b64encode(data).decode()
        with patch.object(gate, 'run_json', side_effect=[changed, {'encoding': 'base64', 'content': bad_goal}]), \
             contextlib.redirect_stderr(io.StringIO()):
            with self.assertRaises(SystemExit):
                gate.validate_candidate_roadmap(REPO, 42, candidate)

    def test_truncated_commit_listing_cannot_hide_closures(self):
        self.rejected(body(record('partial'), 'Refs'), commits=[], commit_count=251)

    def test_truncated_pr_files_cannot_skip_roadmap(self):
        with patch.object(gate, 'run_json', return_value=[]), contextlib.redirect_stderr(io.StringIO()):
            with self.assertRaises(SystemExit):
                gate.validate_candidate_roadmap(REPO, 42, {'changed_files': 3001})

    def test_issue_without_parseable_acceptance_fails_closing(self):
        self.rejected(issue=dict(ISSUE, body='Implement a plugin.'))


if __name__ == '__main__':
    unittest.main()
