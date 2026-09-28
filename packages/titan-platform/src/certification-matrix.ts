export type CertificationCell = { cell_id: string; mandatory: boolean; status: 'PASS' | 'FAIL' | 'SKIPPED'; provenance_ref: string | null };
export type ReleaseEligibility = { schema: 'titan.release-eligibility/v1'; eligible: boolean; failed_cells: readonly string[]; missing_provenance_cells: readonly string[]; cells: readonly CertificationCell[] };

export function evaluateReleaseEligibility(cells: readonly CertificationCell[]): ReleaseEligibility {
  const failed_cells = cells.filter(cell => cell.mandatory && cell.status === 'FAIL').map(cell => cell.cell_id);
  const missing_provenance_cells = cells.filter(cell => cell.mandatory && cell.status !== 'SKIPPED' && !cell.provenance_ref).map(cell => cell.cell_id);
  return { schema: 'titan.release-eligibility/v1', eligible: failed_cells.length === 0 && missing_provenance_cells.length === 0, failed_cells, missing_provenance_cells, cells };
}

