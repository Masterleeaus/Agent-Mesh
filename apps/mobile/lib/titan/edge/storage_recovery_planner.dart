import 'storage_fabric_topology.dart';

class TitanStorageRecoveryStep {
  final int order;
  final String endpointId;
  final TitanStorageProviderKind provider;
  final TitanStorageEndpointState state;
  final List<TitanStorageFabricRole> roles;
  final String action;
  final bool mobileMayExecute;
  final bool canonicalPromotionAllowed;

  const TitanStorageRecoveryStep({
    required this.order,
    required this.endpointId,
    required this.provider,
    required this.state,
    required this.roles,
    required this.action,
    required this.mobileMayExecute,
    this.canonicalPromotionAllowed=false,
  });
}

class TitanStorageRecoveryPlan {
  final String dataClass;
  final String canonicalEndpointId;
  final TitanStorageEndpointState canonicalState;
  final bool degraded;
  final List<TitanStorageRecoveryStep> steps;

  const TitanStorageRecoveryPlan({
    required this.dataClass,
    required this.canonicalEndpointId,
    required this.canonicalState,
    required this.degraded,
    required this.steps,
  });
}

class TitanStorageRecoveryPlanner {
  const TitanStorageRecoveryPlanner();

  TitanStorageRecoveryPlan plan({
    required TitanStorageFabricTopology topology,
    required String dataClass,
  }){
    final route=topology.route(dataClass);
    if(route==null){
      throw StateError('storage route unavailable');
    }
    final canonical=topology.endpoint(route.canonicalEndpointId);
    if(canonical==null){
      throw StateError('storage canonical endpoint missing');
    }

    final steps=<TitanStorageRecoveryStep>[];
    for(var i=0;i<route.recoveryOrder.length;i++){
      final endpoint=topology.endpoint(route.recoveryOrder[i]);
      if(endpoint==null)continue;
      final safeRoles=endpoint.roles.where((role)=>const {
        TitanStorageFabricRole.backup,
        TitanStorageFabricRole.archive,
        TitanStorageFabricRole.authorisedProjection,
        TitanStorageFabricRole.cache,
      }.contains(role)).toList(growable:false);
      steps.add(TitanStorageRecoveryStep(
        order:i+1,
        endpointId:endpoint.endpointId,
        provider:endpoint.provider,
        state:endpoint.state,
        roles:safeRoles,
        action:_action(endpoint,safeRoles),
        mobileMayExecute:endpoint.mobileReadable&&
            endpoint.state==TitanStorageEndpointState.healthy&&
            safeRoles.isNotEmpty,
        canonicalPromotionAllowed:false,
      ));
    }

    return TitanStorageRecoveryPlan(
      dataClass:dataClass,
      canonicalEndpointId:canonical.endpointId,
      canonicalState:canonical.state,
      degraded:canonical.state!=TitanStorageEndpointState.healthy,
      steps:steps,
    );
  }

  String _action(
    TitanStorageFabricEndpoint endpoint,
    List<TitanStorageFabricRole> roles,
  ){
    if(roles.contains(TitanStorageFabricRole.authorisedProjection)){
      return 'continue_bounded_offline_projection';
    }
    if(roles.contains(TitanStorageFabricRole.backup)){
      return 'stage_backup_for_core_governed_restore';
    }
    if(roles.contains(TitanStorageFabricRole.archive)){
      return 'stage_archive_for_core_governed_restore';
    }
    if(roles.contains(TitanStorageFabricRole.cache)){
      return 'use_cache_read_only';
    }
    return 'await_core_recovery';
  }
}
