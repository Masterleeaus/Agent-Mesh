enum TitanEvidenceKind { photo, document, signature }
enum TitanSyncState { queued, syncing, synced, failed }

class TitanEvidenceItem {
  final String id;
  final String jobId;
  final TitanEvidenceKind kind;
  final String localPath;
  final DateTime createdAt;
  final TitanSyncState syncState;
  final int attempts;
  final String? error;
  const TitanEvidenceItem({required this.id, required this.jobId, required this.kind, required this.localPath, required this.createdAt, this.syncState = TitanSyncState.queued, this.attempts = 0, this.error});
  TitanEvidenceItem copyWith({TitanSyncState? syncState, int? attempts, String? error}) => TitanEvidenceItem(id:id,jobId:jobId,kind:kind,localPath:localPath,createdAt:createdAt,syncState:syncState??this.syncState,attempts:attempts??this.attempts,error:error);
}
