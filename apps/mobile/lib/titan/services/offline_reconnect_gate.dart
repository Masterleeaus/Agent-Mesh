import '../models/offline_provenance_envelope.dart';
import '../validation/offline_provenance_contract.dart';
class OfflineReconnectGate {
  const OfflineReconnectGate();
  Map<String,dynamic> prepare(TitanOfflineProvenanceEnvelope envelope){
    OfflineProvenanceContract.validate(envelope);
    return {...envelope.toJson(),
      'requires_server_authority_revalidation':true,
      'requires_command_bus':true,
      'emit_signal_only_after_acceptance':true,
      'surface_authority_elevation':false,
    };
  }
  void assertSameScope({
    required TitanOfflineProvenanceEnvelope envelope,
    required String companyId,required String actorId,required String deviceId,
  }){
    if(envelope.companyId!=companyId||envelope.actorId!=actorId||
       envelope.deviceId!=deviceId) throw StateError('offline replay scope mismatch');
  }
}
