class TitanOfflineLifecycleReconnectPlan {
  final String companyId,actorId,deviceId,trigger;
  final bool refreshProjections,reconcileSignals,replayQueuedMutations;
  final bool requiresAuthenticatedReachability;
  final bool requiresServerAuthorityRevalidation;
  final bool allowsBackgroundConsequentialExecution;
  const TitanOfflineLifecycleReconnectPlan({
    required this.companyId,required this.actorId,required this.deviceId,
    required this.trigger,this.refreshProjections=true,
    this.reconcileSignals=true,this.replayQueuedMutations=true,
    this.requiresAuthenticatedReachability=true,
    this.requiresServerAuthorityRevalidation=true,
    this.allowsBackgroundConsequentialExecution=false,
  });
}
