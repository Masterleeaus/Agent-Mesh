import 'storage_fabric_topology.dart';

class TitanStorageFabricTopologyValidator {
  const TitanStorageFabricTopologyValidator();

  void validate({
    required TitanStorageFabricTopology topology,
    required String companyId,
    required DateTime now,
    bool enforceFreshness=true,
  }){
    if(topology.companyId!=companyId){
      throw StateError('storage topology company mismatch');
    }
    if(topology.sequence<=0||
        topology.revision.trim().isEmpty||
        topology.correlationId.trim().isEmpty){
      throw StateError('storage topology identity incomplete');
    }
    if(enforceFreshness&&
        (topology.issuedAt.isAfter(now.add(const Duration(minutes:5)))||
         now.difference(topology.issuedAt)>const Duration(days:7))){
      throw StateError('storage topology timestamp invalid');
    }

    final endpointIds=<String>{};
    for(final endpoint in topology.endpoints){
      if(endpoint.endpointId.trim().isEmpty||
          !endpointIds.add(endpoint.endpointId)){
        throw StateError('storage topology endpoint id invalid/duplicate');
      }
      if(endpoint.companyId!=companyId){
        throw StateError('storage endpoint company mismatch');
      }
      _validateProviderRoles(endpoint);
      if(endpoint.accessMode==TitanStorageAccessMode.statusOnly&&
          (endpoint.mobileReadable||endpoint.mobileWritable)){
        throw StateError(
          'status-only storage endpoint cannot claim mobile access',
        );
      }
      if(endpoint.accessMode==TitanStorageAccessMode.delegatedHttps&&
          endpoint.allowedTransferHosts.isEmpty){
        throw StateError(
          'delegated storage endpoint requires transfer host allowlist',
        );
      }
      for(final host in endpoint.allowedTransferHosts){
        if(host.trim().isEmpty||
            host.contains('/')||
            host.contains('@')||
            host.contains('?')||
            host.contains('#')||
            RegExp(r'\s').hasMatch(host)){
          throw StateError('storage transfer host allowlist is invalid');
        }
      }
      if(endpoint.credentialMode.contains('raw_')||
          endpoint.credentialMode.contains('access_key')||
          endpoint.credentialMode.contains('password')){
        throw StateError(
          'mobile storage topology cannot contain raw provider credentials',
        );
      }
    }

    final dataClasses=<String>{};
    for(final route in topology.routes){
      if(route.dataClass.trim().isEmpty||
          !dataClasses.add(route.dataClass)){
        throw StateError('storage data class route invalid/duplicate');
      }
      final canonical=topology.endpoint(route.canonicalEndpointId);
      if(canonical==null){
        throw StateError('storage canonical endpoint missing');
      }
      if(!canonical.supportsRole(TitanStorageFabricRole.canonical)||
          !canonical.supportsDataClass(route.dataClass)){
        throw StateError('storage canonical endpoint role mismatch');
      }
      _validateCanonicalProvider(route,canonical);
      final canonicalAdvertisers=topology.endpoints
          .where((endpoint)=>
            endpoint.supportsRole(TitanStorageFabricRole.canonical)&&
            endpoint.supportsDataClass(route.dataClass))
          .map((endpoint)=>endpoint.endpointId)
          .toSet();
      if(canonicalAdvertisers.length!=1||
          !canonicalAdvertisers.contains(route.canonicalEndpointId)){
        throw StateError(
          'storage data class must have exactly one canonical endpoint',
        );
      }

      final referenced=<String>{
        ...route.replicaEndpointIds,
        ...route.authorisedProjectionEndpointIds,
        ...route.cacheEndpointIds,
        ...route.evidenceEndpointIds,
        ...route.backupEndpointIds,
        ...route.archiveEndpointIds,
        ...route.recoveryOrder,
      };
      for(final id in referenced){
        if(topology.endpoint(id)==null){
          throw StateError('storage route references unknown endpoint');
        }
      }
      _requireRoles(
        topology,
        route.replicaEndpointIds,
        route.dataClass,
        TitanStorageFabricRole.replica,
      );
      _requireRoles(
        topology,
        route.authorisedProjectionEndpointIds,
        route.dataClass,
        TitanStorageFabricRole.authorisedProjection,
      );
      _requireRoles(
        topology,
        route.cacheEndpointIds,
        route.dataClass,
        TitanStorageFabricRole.cache,
      );
      _requireRoles(
        topology,
        route.evidenceEndpointIds,
        route.dataClass,
        TitanStorageFabricRole.evidence,
      );
      _requireRoles(
        topology,
        route.backupEndpointIds,
        route.dataClass,
        TitanStorageFabricRole.backup,
      );
      _requireRoles(
        topology,
        route.archiveEndpointIds,
        route.dataClass,
        TitanStorageFabricRole.archive,
      );
    }
  }

  void _requireRoles(
    TitanStorageFabricTopology topology,
    List<String> ids,
    String dataClass,
    TitanStorageFabricRole role,
  ){
    for(final id in ids){
      final endpoint=topology.endpoint(id)!;
      if(!endpoint.supportsRole(role)||
          !endpoint.supportsDataClass(dataClass)){
        throw StateError(
          'storage endpoint does not support declared route role',
        );
      }
    }
  }

  void _validateProviderRoles(TitanStorageFabricEndpoint endpoint){
    if(endpoint.roles.contains(TitanStorageFabricRole.canonical)&&
        endpoint.accessMode!=TitanStorageAccessMode.statusOnly){
      throw StateError(
        'mobile must not execute directly against canonical business store',
      );
    }
    if(endpoint.roles.contains(TitanStorageFabricRole.replica)&&
        endpoint.accessMode!=TitanStorageAccessMode.statusOnly){
      throw StateError(
        'mobile must not execute directly against transactional replica',
      );
    }
  }

  void _validateCanonicalProvider(
    TitanStorageDataClassRoute route,
    TitanStorageFabricEndpoint endpoint,
  ){
    const transactional={
      TitanStorageProviderKind.postgres,
      TitanStorageProviderKind.mysql,
      TitanStorageProviderKind.sqlite,
      TitanStorageProviderKind.awsRds,
      TitanStorageProviderKind.customerVps,
      TitanStorageProviderKind.titanManaged,
    };
    const objects={
      TitanStorageProviderKind.localFilesystem,
      TitanStorageProviderKind.nas,
      TitanStorageProviderKind.s3,
      TitanStorageProviderKind.s3Compatible,
      TitanStorageProviderKind.minio,
      TitanStorageProviderKind.customerVps,
      TitanStorageProviderKind.titanManaged,
    };
    const documents={
      TitanStorageProviderKind.googleDrive,
      TitanStorageProviderKind.dropbox,
      TitanStorageProviderKind.oneDrive,
      TitanStorageProviderKind.sharePoint,
      TitanStorageProviderKind.s3,
      TitanStorageProviderKind.s3Compatible,
      TitanStorageProviderKind.minio,
      TitanStorageProviderKind.customerVps,
      TitanStorageProviderKind.titanManaged,
    };
    final allowed=switch(route.kind){
      TitanStorageDataClassKind.transactional=>transactional,
      TitanStorageDataClassKind.object=>objects,
      TitanStorageDataClassKind.document=>documents,
      TitanStorageDataClassKind.projection=>const {
        TitanStorageProviderKind.deviceEncrypted,
        TitanStorageProviderKind.localFilesystem,
        TitanStorageProviderKind.customerVps,
        TitanStorageProviderKind.titanManaged,
      },
    };
    if(!allowed.contains(endpoint.provider)){
      throw StateError(
        'storage canonical provider incompatible with data class kind',
      );
    }
    if(route.kind==TitanStorageDataClassKind.transactional&&
        const {
          TitanStorageProviderKind.googleDrive,
          TitanStorageProviderKind.dropbox,
          TitanStorageProviderKind.oneDrive,
          TitanStorageProviderKind.sharePoint,
        }.contains(endpoint.provider)){
      throw StateError(
        'document provider cannot be transactional canonical database',
      );
    }
  }

}
