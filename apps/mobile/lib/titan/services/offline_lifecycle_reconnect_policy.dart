import '../models/offline_lifecycle_reconnect_plan.dart';
class OfflineLifecycleReconnectPolicy {
  const OfflineLifecycleReconnectPolicy();
  TitanOfflineLifecycleReconnectPlan plan({
    required String companyId,required String actorId,required String deviceId,
    required String trigger,required bool authenticatedReachability,
  }){
    if([companyId,actorId,deviceId].any((v)=>v.trim().isEmpty))
      throw StateError('lifecycle reconnect requires company/actor/device scope');
    if(!const {'app_resume','connectivity_restored','background_refresh'}
        .contains(trigger)) throw StateError('unsupported reconnect trigger');
    return TitanOfflineLifecycleReconnectPlan(
      companyId:companyId,actorId:actorId,deviceId:deviceId,trigger:trigger,
      replayQueuedMutations:authenticatedReachability,
      reconcileSignals:authenticatedReachability,
      requiresAuthenticatedReachability:true,
      requiresServerAuthorityRevalidation:true,
      allowsBackgroundConsequentialExecution:false,
    );
  }
}
