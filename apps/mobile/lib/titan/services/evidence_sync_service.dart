import '../models/evidence_item.dart';
import 'titan_gateway.dart';

/// MVP evidence coordinator. Binary upload is intentionally delegated to the
/// future authenticated Titan transport; the Command Bus receives metadata.
class EvidenceSyncService {
  final TitanGateway gateway;
  EvidenceSyncService(this.gateway);
  Future<TitanEvidenceItem> queue(TitanEvidenceItem item) async {
    try {
      await gateway.command('job.evidence.attach', {
        'job_id': item.jobId,
        'evidence_id': item.id,
        'kind': item.kind.name,
        'local_path': item.localPath,
        'captured_at': item.createdAt.toIso8601String(),
      });
      return item.copyWith(syncState: TitanSyncState.queued);
    } catch (e) {
      return item.copyWith(syncState: TitanSyncState.failed, attempts: item.attempts + 1, error: e.toString());
    }
  }
  Future<TitanEvidenceItem> retry(TitanEvidenceItem item) => queue(item.copyWith(syncState: TitanSyncState.syncing, attempts: item.attempts + 1));
}
