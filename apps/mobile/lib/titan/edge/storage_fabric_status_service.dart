import 'storage_fabric_topology.dart';
import 'storage_recovery_planner.dart';

class TitanStorageFabricStatusService {
  const TitanStorageFabricStatusService();

  Map<String,dynamic> summary(
    TitanStorageFabricTopology topology, {
    DateTime? now,
  }){
    final at=(now??DateTime.now()).toUtc();
    final stale=at.difference(topology.issuedAt.toUtc())>
        const Duration(hours:24);
    final degradedRoutes=<Map<String,dynamic>>[];
    for(final route in topology.routes){
      final plan=const TitanStorageRecoveryPlanner().plan(
        topology:topology,
        dataClass:route.dataClass,
      );
      if(plan.degraded){
        degradedRoutes.add({
          'data_class':route.dataClass,
          'canonical_endpoint_id':plan.canonicalEndpointId,
          'canonical_state':plan.canonicalState.name,
          'mobile_promotes_canonical':false,
          'recovery_sources':plan.steps.length,
        });
      }
    }
    return {
      'company_id':topology.companyId,
      'sequence':topology.sequence,
      'revision':topology.revision,
      'stale':stale,
      'endpoint_count':topology.endpoints.length,
      'healthy_endpoints':topology.endpoints
          .where((e)=>e.state==TitanStorageEndpointState.healthy)
          .length,
      'degraded_data_classes':degradedRoutes,
      'canonical_owner_count':topology.routes.length,
      'mobile_can_promote_canonical':false,
      'issued_at':topology.issuedAt.toUtc().toIso8601String(),
    };
  }
}
