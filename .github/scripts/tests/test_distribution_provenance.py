import importlib.util
import json
from pathlib import Path
import unittest

SCRIPT = Path(__file__).resolve().parents[1] / 'check-distribution-provenance.py'
SPEC = importlib.util.spec_from_file_location('distribution_provenance', SCRIPT)
MODULE = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(MODULE)
ROOT = Path(__file__).resolve().parents[3]


class DistributionProvenanceTests(unittest.TestCase):
    def setUp(self):
        self.inventory = json.loads((ROOT / 'docs/contracts/distribution-provenance.json').read_text())

    def test_current_inventory_records_unknown_rights_without_granting_a_license(self):
        self.assertEqual(MODULE.validate(ROOT, self.inventory), [])
        self.assertEqual(self.inventory['policy']['repository_license_decision'], 'OWNER_DECISION_REQUIRED')
        self.assertEqual(self.inventory['policy']['unknown_rights'], 'BLOCK_DISTRIBUTION')
        self.assertEqual(self.inventory['artifacts'][0]['first_party_spdx'], 'NOASSERTION')

    def test_browser_candidate_cannot_generate_notices_while_blocked(self):
        with self.assertRaisesRegex(PermissionError, 'distribution blocked'):
            MODULE.generate_notices(ROOT, self.inventory, 'titan-zero-browser-node')

    def test_unknown_or_incomplete_source_cannot_be_marked_approved(self):
        browser = self.inventory['artifacts'][1]
        browser['distribution_state'] = 'approved'
        self.assertTrue(any('requires first-party SPDX' in error
                            for error in MODULE.validate(ROOT, self.inventory)))
        self.assertTrue(any('dependency license inventory is incomplete' in error
                            for error in MODULE.validate(ROOT, self.inventory)))
        self.assertTrue(any('component is missing or not approved' in error
                            for error in MODULE.validate(ROOT, self.inventory)))
        self.assertTrue(any('owner decision record' in error
                            for error in MODULE.validate(ROOT, self.inventory)))

    def test_modified_donor_source_is_detected_against_recorded_hash(self):
        self.inventory['components'][0]['local_evidence'][0]['sha256'] = '0' * 64
        self.assertTrue(any('evidence hash changed' in error
                            for error in MODULE.validate(ROOT, self.inventory)))

    def test_inventory_paths_cannot_escape_repository(self):
        self.inventory['components'][0]['local_evidence'][0]['path'] = '../../etc/passwd'
        self.assertTrue(any('evidence file missing' in error
                            for error in MODULE.validate(ROOT, self.inventory)))

    def test_package_audit_detects_license_fields_without_conferring_rights(self):
        rows = MODULE.package_manifests(ROOT)
        root = next(row for row in rows if row['path'] == 'package.json')
        self.assertEqual(root['license'], 'NOASSERTION')
        self.assertTrue(root['private'])
        self.assertGreater(len(rows), 10)

    def test_archive_hashes_and_license_text_are_evidence_not_redistribution_approval(self):
        archives = MODULE.archive_inputs(ROOT)
        self.assertGreater(len(archives), 50)
        self.assertTrue(all(row['spdx'] == 'NOASSERTION'
                            and row['redistribution_state'] == 'uninspected_archive_content'
                            for row in archives))
        evidence = MODULE.license_evidence_files(ROOT)
        self.assertTrue(evidence)
        self.assertTrue(all(row['rights_review'] == 'required' for row in evidence))


if __name__ == '__main__':
    unittest.main()
