import '../storage/secure_store.dart';
import '../edge/edge_node_identity_service.dart';
import '../edge/edge_node_identity.dart';

class TitanRemoteWipeDirective {
  final String companyId;
  final String deviceId;
  final String canonicalReceiptRef;
  final String reason;
  const TitanRemoteWipeDirective({required this.companyId,required this.deviceId,required this.canonicalReceiptRef,required this.reason});
}

class TitanDeviceWipeCoordinator {
  final String companyId;
  final String deviceId;
  final TitanEdgeNodeIdentityService identityService;
  final TitanSecureStore secureStore;
  final List<String> scopedSecretKeys;
  const TitanDeviceWipeCoordinator({required this.companyId,required this.deviceId,required this.identityService,required this.secureStore,this.scopedSecretKeys=const []});

  Future<void> apply(TitanRemoteWipeDirective directive) async{
    if(directive.companyId!=companyId||directive.deviceId!=deviceId)throw StateError('remote wipe scope mismatch');
    if(directive.canonicalReceiptRef.trim().isEmpty)throw StateError('remote wipe requires canonical receipt');
    await identityService.revokeLocalIdentity(state:TitanEdgeRegistrationState.revoked);
    for(final key in scopedSecretKeys){await secureStore.delete(key);}
    // Application ciphertext can remain physically present after key destruction;
    // it is no longer decryptable. Provider/server deletion is a separate governed action.
  }
}
