import 'edge_storage_manifest.dart';
import 'edge_storage_policy_service.dart';
import 'storage_fabric_topology.dart';

class TitanMobileStorageTopologyProjector {
  final TitanMobileStoragePolicyService localPolicy;

  const TitanMobileStorageTopologyProjector({
    this.localPolicy=const TitanMobileStoragePolicyService(),
  });

  TitanMobileStorageManifest project({
    required TitanStorageFabricTopology topology,
    required String companyId,
    required String nodeId,
    required String surface,
    DateTime? now,
  }){
    if(topology.companyId!=companyId){
      throw StateError('storage topology projection company mismatch');
    }
    final at=(now??DateTime.now()).toUtc();
    final base=localPolicy.defaultManifest(
      companyId:companyId,
      nodeId:nodeId,
      surface:surface,
      now:at,
    );

    final projected=<String,TitanMobileStorageEntry>{
      for(final entry in base.entries)entry.dataClass:entry,
    };

    final localEndpoints=topology.endpoints.where(
      (endpoint)=>
        endpoint.nodeId==nodeId&&
        const {
          TitanStorageProviderKind.deviceEncrypted,
          TitanStorageProviderKind.localFilesystem,
        }.contains(endpoint.provider),
    ).toList(growable:false);

    for(final route in topology.routes){
      for(final endpoint in localEndpoints){
        final role=_roleFor(route,endpoint.endpointId);
        if(role==null)continue;
        projected[route.dataClass]=TitanMobileStorageEntry(
          dataClass:route.dataClass,
          role:role,
          protection:endpoint.protection.isEmpty
              ?'aes-256-gcm'
              :endpoint.protection,
          offlineAvailable:true,
          canonicalOwner:route.canonicalEndpointId,
          updatedAt:at,
        );
      }
    }

    final manifest=TitanMobileStorageManifest(
      companyId:companyId,
      nodeId:nodeId,
      entries:projected.values.toList(growable:false),
      generatedAt:at,
    );
    localPolicy.validate(manifest);
    return manifest;
  }

  TitanMobileStorageRole? _roleFor(
    TitanStorageDataClassRoute route,
    String endpointId,
  ){
    if(route.authorisedProjectionEndpointIds.contains(endpointId)){
      return TitanMobileStorageRole.authorisedProjection;
    }
    if(route.cacheEndpointIds.contains(endpointId)){
      return TitanMobileStorageRole.cache;
    }
    if(route.evidenceEndpointIds.contains(endpointId)){
      return TitanMobileStorageRole.evidenceStaging;
    }
    return null;
  }
}
