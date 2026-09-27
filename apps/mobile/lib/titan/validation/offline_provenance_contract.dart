import '../models/offline_provenance_envelope.dart';
class OfflineProvenanceContract {
  static void validate(TitanOfflineProvenanceEnvelope e){
    if([e.companyId,e.actorId,e.deviceId,e.agentId,e.capabilityId,e.idempotencyKey]
        .any((v)=>v.trim().isEmpty)) throw StateError('offline provenance incomplete');
    if(e.authorityState!='offline_contracted')
      throw StateError('offline authority must contract');
    if(e.approvalState!='revalidate_on_reconnect')
      throw StateError('offline approval cannot survive reconnect without revalidation');
    if(e.mutationRevision<1)throw StateError('mutation revision required');
    if(e.basedOnRevision!=null&&e.basedOnRevision!<0)
      throw StateError('based_on_revision cannot be negative');
  }
}
