import 'storage_adapter_registry.dart';
import 'storage_fabric_topology.dart';
import 'storage_provider_adapter.dart';

class TitanStorageFabricExecutor {
  final String companyId;
  final TitanStorageFabricTopology topology;
  final TitanStorageAdapterRegistry adapters;

  const TitanStorageFabricExecutor({
    required this.companyId,
    required this.topology,
    required this.adapters,
  });

  Future<TitanStorageTransferReceipt> write({
    required TitanStorageFabricRole role,
    required TitanStorageObject object,
    required String operationId,
    String preferredEndpointId='',
  }) async{
    if(object.companyId!=companyId||
        topology.companyId!=companyId){
      throw StateError('storage execution company mismatch');
    }
    if(role==TitanStorageFabricRole.canonical||
        role==TitanStorageFabricRole.replica){
      throw StateError(
        'mobile Storage Fabric cannot directly write canonical/replica stores',
      );
    }
    final route=topology.route(object.dataClass);
    if(route==null){
      throw StateError('storage data class route unavailable');
    }
    final candidates=_idsForRole(route,role);
    final endpoint=_selectEndpoint(
      ids:candidates,
      role:role,
      preferredEndpointId:preferredEndpointId,
      write:true,
    );
    final adapter=adapters.forEndpoint(endpoint);
    if(adapter==null){
      throw StateError('storage provider adapter unavailable');
    }
    return adapter.write(
      endpoint:endpoint,
      role:role,
      object:object,
      operationId:operationId,
    );
  }

  Future<TitanStorageReadResult> read({
    required TitanStorageFabricRole role,
    required String dataClass,
    required String objectId,
    required String operationId,
    String preferredEndpointId='',
  }) async{
    if(topology.companyId!=companyId){
      throw StateError('storage execution company mismatch');
    }
    if(role==TitanStorageFabricRole.canonical||
        role==TitanStorageFabricRole.replica){
      throw StateError(
        'mobile Storage Fabric cannot directly read canonical/replica stores',
      );
    }
    final route=topology.route(dataClass);
    if(route==null){
      throw StateError('storage data class route unavailable');
    }
    final candidates=_idsForRole(route,role);
    final endpoint=_selectEndpoint(
      ids:candidates,
      role:role,
      preferredEndpointId:preferredEndpointId,
      write:false,
    );
    final adapter=adapters.forEndpoint(endpoint);
    if(adapter==null){
      throw StateError('storage provider adapter unavailable');
    }
    return adapter.read(
      endpoint:endpoint,
      role:role,
      companyId:companyId,
      dataClass:dataClass,
      objectId:objectId,
      operationId:operationId,
    );
  }

  /// Restore is intentionally only a staged read. It never promotes a
  /// backup/archive into canonical business state on the phone.
  Future<TitanStorageReadResult> stageRestore({
    required String dataClass,
    required String objectId,
    required String operationId,
  }) async{
    final route=topology.route(dataClass);
    if(route==null){
      throw StateError('storage data class route unavailable');
    }
    for(final endpointId in route.recoveryOrder){
      final endpoint=topology.endpoint(endpointId);
      if(endpoint==null||
          endpoint.state!=TitanStorageEndpointState.healthy||
          !endpoint.mobileReadable){
        continue;
      }
      final role=_recoveryRole(endpoint);
      if(role==null)continue;
      final adapter=adapters.forEndpoint(endpoint);
      if(adapter==null||!adapter.supportedRoles.contains(role)){
        continue;
      }
      return adapter.read(
        endpoint:endpoint,
        role:role,
        companyId:companyId,
        dataClass:dataClass,
        objectId:objectId,
        operationId:operationId,
      );
    }
    throw StateError('no authorised healthy restore source available');
  }

  TitanStorageFabricEndpoint _selectEndpoint({
    required List<String> ids,
    required TitanStorageFabricRole role,
    required String preferredEndpointId,
    required bool write,
  }){
    final ordered=<String>[
      if(preferredEndpointId.isNotEmpty)preferredEndpointId,
      ...ids.where((id)=>id!=preferredEndpointId),
    ];
    for(final id in ordered){
      if(!ids.contains(id))continue;
      final endpoint=topology.endpoint(id);
      if(endpoint==null||
          endpoint.state!=TitanStorageEndpointState.healthy||
          !endpoint.supportsRole(role)||
          (write&&!endpoint.mobileWritable)||
          (!write&&!endpoint.mobileReadable)){
        continue;
      }
      if(adapters.forEndpoint(endpoint)==null)continue;
      return endpoint;
    }
    throw StateError(
      'no healthy authorised mobile storage endpoint for ${role.name}',
    );
  }

  List<String> _idsForRole(
    TitanStorageDataClassRoute route,
    TitanStorageFabricRole role,
  )=>switch(role){
    TitanStorageFabricRole.authorisedProjection=>
      route.authorisedProjectionEndpointIds,
    TitanStorageFabricRole.cache=>route.cacheEndpointIds,
    TitanStorageFabricRole.evidence=>route.evidenceEndpointIds,
    TitanStorageFabricRole.backup=>route.backupEndpointIds,
    TitanStorageFabricRole.archive=>route.archiveEndpointIds,
    TitanStorageFabricRole.canonical=>const [],
    TitanStorageFabricRole.replica=>const [],
  };

  TitanStorageFabricRole? _recoveryRole(
    TitanStorageFabricEndpoint endpoint,
  ){
    for(final role in const [
      TitanStorageFabricRole.backup,
      TitanStorageFabricRole.archive,
      TitanStorageFabricRole.authorisedProjection,
      TitanStorageFabricRole.cache,
    ]){
      if(endpoint.roles.contains(role))return role;
    }
    return null;
  }
}
