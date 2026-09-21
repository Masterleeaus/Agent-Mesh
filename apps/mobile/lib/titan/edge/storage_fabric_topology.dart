enum TitanStorageFabricRole {
  canonical,
  replica,
  authorisedProjection,
  cache,
  evidence,
  backup,
  archive,
}

enum TitanStorageDataClassKind {
  transactional,
  object,
  document,
  projection,
}

enum TitanStorageProviderKind {
  deviceEncrypted,
  localFilesystem,
  nas,
  s3,
  s3Compatible,
  minio,
  googleDrive,
  dropbox,
  oneDrive,
  sharePoint,
  postgres,
  mysql,
  sqlite,
  awsRds,
  customerVps,
  titanManaged,
}

enum TitanStorageAccessMode {
  deviceLocal,
  delegatedHttps,
  localBridge,
  statusOnly,
}

enum TitanStorageEndpointState {
  healthy,
  degraded,
  unavailable,
  unknown,
}

class TitanStorageFabricEndpoint {
  final String endpointId;
  final String companyId;
  final String displayName;
  final String nodeId;
  final TitanStorageProviderKind provider;
  final TitanStorageAccessMode accessMode;
  final TitanStorageEndpointState state;
  final List<TitanStorageFabricRole> roles;
  final List<String> dataClasses;
  final String locality;
  final String protection;
  final String residency;
  final String credentialMode;
  final List<String> allowedTransferHosts;
  final bool mobileReadable;
  final bool mobileWritable;
  final DateTime observedAt;

  const TitanStorageFabricEndpoint({
    required this.endpointId,
    required this.companyId,
    required this.displayName,
    this.nodeId='',
    required this.provider,
    required this.accessMode,
    required this.state,
    required this.roles,
    required this.dataClasses,
    required this.locality,
    required this.protection,
    required this.residency,
    required this.credentialMode,
    this.allowedTransferHosts=const [],
    required this.mobileReadable,
    required this.mobileWritable,
    required this.observedAt,
  });

  bool supportsRole(TitanStorageFabricRole role)=>roles.contains(role);
  bool supportsDataClass(String dataClass)=>
      dataClasses.isEmpty||dataClasses.contains(dataClass);

  factory TitanStorageFabricEndpoint.fromJson(
    Map<String,dynamic> json,
  )=>TitanStorageFabricEndpoint(
    endpointId:(json['endpoint_id']??'').toString(),
    companyId:(json['company_id']??'').toString(),
    displayName:(json['display_name']??'').toString(),
    nodeId:(json['node_id']??'').toString(),
    provider:titanStorageProviderFromWire(
      (json['provider']??'').toString(),
    ),
    accessMode:titanStorageAccessModeFromWire(
      (json['access_mode']??'status_only').toString(),
    ),
    state:TitanStorageEndpointState.values.firstWhere(
      (value)=>value.name==(json['state']??'unknown').toString(),
      orElse:()=>TitanStorageEndpointState.unknown,
    ),
    roles:((json['roles'] as List?)??const [])
        .map((raw)=>titanStorageRoleFromWire('$raw'))
        .toList(growable:false),
    dataClasses:((json['data_classes'] as List?)??const [])
        .map((value)=>'$value')
        .toList(growable:false),
    locality:(json['locality']??'unknown').toString(),
    protection:(json['protection']??'').toString(),
    residency:(json['residency']??'').toString(),
    credentialMode:(json['credential_mode']??'none').toString(),
    allowedTransferHosts:
        ((json['allowed_transfer_hosts'] as List?)??const [])
            .map((value)=>'$value'.toLowerCase())
            .toList(growable:false),
    mobileReadable:json['mobile_readable']==true,
    mobileWritable:json['mobile_writable']==true,
    observedAt:DateTime.tryParse(
      (json['observed_at']??'').toString(),
    )??DateTime.fromMillisecondsSinceEpoch(0),
  );

  Map<String,dynamic> toJson()=> {
    'endpoint_id':endpointId,
    'company_id':companyId,
    'display_name':displayName,
    if(nodeId.isNotEmpty)'node_id':nodeId,
    'provider':titanStorageProviderWire(provider),
    'access_mode':titanStorageAccessModeWire(accessMode),
    'state':state.name,
    'roles':roles.map(titanStorageRoleWire).toList(),
    'data_classes':dataClasses,
    'locality':locality,
    'protection':protection,
    'residency':residency,
    'credential_mode':credentialMode,
    if(allowedTransferHosts.isNotEmpty)
      'allowed_transfer_hosts':allowedTransferHosts,
    'mobile_readable':mobileReadable,
    'mobile_writable':mobileWritable,
    'observed_at':observedAt.toUtc().toIso8601String(),
  };
}

class TitanStorageDataClassRoute {
  final String dataClass;
  final TitanStorageDataClassKind kind;
  final String canonicalEndpointId;
  final List<String> replicaEndpointIds;
  final List<String> authorisedProjectionEndpointIds;
  final List<String> cacheEndpointIds;
  final List<String> evidenceEndpointIds;
  final List<String> backupEndpointIds;
  final List<String> archiveEndpointIds;
  final List<String> recoveryOrder;
  final String syncMode;
  final String privacyClass;
  final String retentionPolicy;

  const TitanStorageDataClassRoute({
    required this.dataClass,
    this.kind=TitanStorageDataClassKind.transactional,
    required this.canonicalEndpointId,
    this.replicaEndpointIds=const [],
    this.authorisedProjectionEndpointIds=const [],
    this.cacheEndpointIds=const [],
    this.evidenceEndpointIds=const [],
    this.backupEndpointIds=const [],
    this.archiveEndpointIds=const [],
    this.recoveryOrder=const [],
    this.syncMode='core_governed',
    this.privacyClass='customer_controlled',
    this.retentionPolicy='core_governed',
  });

  factory TitanStorageDataClassRoute.fromJson(
    Map<String,dynamic> json,
  )=>TitanStorageDataClassRoute(
    dataClass:(json['data_class']??'').toString(),
    kind:TitanStorageDataClassKind.values.firstWhere(
      (value)=>value.name==(json['kind']??'transactional').toString(),
      orElse:()=>throw StateError('unknown storage data class kind'),
    ),
    canonicalEndpointId:
        (json['canonical_endpoint_id']??'').toString(),
    replicaEndpointIds:_strings(json['replica_endpoint_ids']),
    authorisedProjectionEndpointIds:
        _strings(json['authorised_projection_endpoint_ids']),
    cacheEndpointIds:_strings(json['cache_endpoint_ids']),
    evidenceEndpointIds:_strings(json['evidence_endpoint_ids']),
    backupEndpointIds:_strings(json['backup_endpoint_ids']),
    archiveEndpointIds:_strings(json['archive_endpoint_ids']),
    recoveryOrder:_strings(json['recovery_order']),
    syncMode:(json['sync_mode']??'core_governed').toString(),
    privacyClass:
        (json['privacy_class']??'customer_controlled').toString(),
    retentionPolicy:
        (json['retention_policy']??'core_governed').toString(),
  );

  Map<String,dynamic> toJson()=> {
    'data_class':dataClass,
    'kind':kind.name,
    'canonical_endpoint_id':canonicalEndpointId,
    'replica_endpoint_ids':replicaEndpointIds,
    'authorised_projection_endpoint_ids':
        authorisedProjectionEndpointIds,
    'cache_endpoint_ids':cacheEndpointIds,
    'evidence_endpoint_ids':evidenceEndpointIds,
    'backup_endpoint_ids':backupEndpointIds,
    'archive_endpoint_ids':archiveEndpointIds,
    'recovery_order':recoveryOrder,
    'sync_mode':syncMode,
    'privacy_class':privacyClass,
    'retention_policy':retentionPolicy,
  };

  static List<String> _strings(dynamic value)=>
      ((value as List?)??const [])
          .map((item)=>'$item')
          .toList(growable:false);
}

class TitanStorageFabricTopology {
  final String companyId;
  final int sequence;
  final String revision;
  final String correlationId;
  final DateTime issuedAt;
  final List<TitanStorageFabricEndpoint> endpoints;
  final List<TitanStorageDataClassRoute> routes;

  const TitanStorageFabricTopology({
    required this.companyId,
    required this.sequence,
    required this.revision,
    required this.correlationId,
    required this.issuedAt,
    required this.endpoints,
    required this.routes,
  });

  TitanStorageFabricEndpoint? endpoint(String id){
    for(final endpoint in endpoints){
      if(endpoint.endpointId==id)return endpoint;
    }
    return null;
  }

  TitanStorageDataClassRoute? route(String dataClass){
    for(final route in routes){
      if(route.dataClass==dataClass)return route;
    }
    return null;
  }

  factory TitanStorageFabricTopology.fromJson(
    Map<String,dynamic> json,
  )=>TitanStorageFabricTopology(
    companyId:(json['company_id']??'').toString(),
    sequence:(json['sequence'] as num?)?.toInt()??0,
    revision:(json['revision']??'').toString(),
    correlationId:(json['correlation_id']??'').toString(),
    issuedAt:DateTime.tryParse(
      (json['issued_at']??'').toString(),
    )??DateTime.fromMillisecondsSinceEpoch(0),
    endpoints:((json['endpoints'] as List?)??const [])
        .map((row)=>TitanStorageFabricEndpoint.fromJson(
          Map<String,dynamic>.from(row as Map),
        ))
        .toList(growable:false),
    routes:((json['routes'] as List?)??const [])
        .map((row)=>TitanStorageDataClassRoute.fromJson(
          Map<String,dynamic>.from(row as Map),
        ))
        .toList(growable:false),
  );

  Map<String,dynamic> toJson()=> {
    'company_id':companyId,
    'sequence':sequence,
    'revision':revision,
    'correlation_id':correlationId,
    'issued_at':issuedAt.toUtc().toIso8601String(),
    'endpoints':endpoints.map((item)=>item.toJson()).toList(),
    'routes':routes.map((item)=>item.toJson()).toList(),
  };
}


TitanStorageFabricRole titanStorageRoleFromWire(String raw){
  switch(raw){
    case 'canonical':
      return TitanStorageFabricRole.canonical;
    case 'replica':
      return TitanStorageFabricRole.replica;
    case 'authorised_projection':
    case 'authorized_projection':
      return TitanStorageFabricRole.authorisedProjection;
    case 'cache':
      return TitanStorageFabricRole.cache;
    case 'evidence':
      return TitanStorageFabricRole.evidence;
    case 'backup':
      return TitanStorageFabricRole.backup;
    case 'archive':
      return TitanStorageFabricRole.archive;
    default:
      throw StateError('unsupported Storage Fabric role: $raw');
  }
}

String titanStorageRoleWire(TitanStorageFabricRole role)=>switch(role){
  TitanStorageFabricRole.canonical=>'canonical',
  TitanStorageFabricRole.replica=>'replica',
  TitanStorageFabricRole.authorisedProjection=>'authorised_projection',
  TitanStorageFabricRole.cache=>'cache',
  TitanStorageFabricRole.evidence=>'evidence',
  TitanStorageFabricRole.backup=>'backup',
  TitanStorageFabricRole.archive=>'archive',
};

TitanStorageProviderKind titanStorageProviderFromWire(String raw){
  switch(raw){
    case 'device_encrypted':
    case 'deviceEncrypted':
      return TitanStorageProviderKind.deviceEncrypted;
    case 'local_filesystem':
    case 'localFilesystem':
      return TitanStorageProviderKind.localFilesystem;
    case 'nas':
      return TitanStorageProviderKind.nas;
    case 's3':
      return TitanStorageProviderKind.s3;
    case 's3_compatible':
    case 's3Compatible':
      return TitanStorageProviderKind.s3Compatible;
    case 'minio':
      return TitanStorageProviderKind.minio;
    case 'google_drive':
    case 'googleDrive':
      return TitanStorageProviderKind.googleDrive;
    case 'dropbox':
      return TitanStorageProviderKind.dropbox;
    case 'one_drive':
    case 'oneDrive':
      return TitanStorageProviderKind.oneDrive;
    case 'share_point':
    case 'sharePoint':
      return TitanStorageProviderKind.sharePoint;
    case 'postgres':
      return TitanStorageProviderKind.postgres;
    case 'mysql':
      return TitanStorageProviderKind.mysql;
    case 'sqlite':
      return TitanStorageProviderKind.sqlite;
    case 'aws_rds':
    case 'awsRds':
      return TitanStorageProviderKind.awsRds;
    case 'customer_vps':
    case 'customerVps':
      return TitanStorageProviderKind.customerVps;
    case 'titan_managed':
    case 'titanManaged':
      return TitanStorageProviderKind.titanManaged;
    default:
      throw StateError('unsupported Storage Fabric provider: $raw');
  }
}

String titanStorageProviderWire(TitanStorageProviderKind provider)=>
    switch(provider){
  TitanStorageProviderKind.deviceEncrypted=>'device_encrypted',
  TitanStorageProviderKind.localFilesystem=>'local_filesystem',
  TitanStorageProviderKind.nas=>'nas',
  TitanStorageProviderKind.s3=>'s3',
  TitanStorageProviderKind.s3Compatible=>'s3_compatible',
  TitanStorageProviderKind.minio=>'minio',
  TitanStorageProviderKind.googleDrive=>'google_drive',
  TitanStorageProviderKind.dropbox=>'dropbox',
  TitanStorageProviderKind.oneDrive=>'one_drive',
  TitanStorageProviderKind.sharePoint=>'share_point',
  TitanStorageProviderKind.postgres=>'postgres',
  TitanStorageProviderKind.mysql=>'mysql',
  TitanStorageProviderKind.sqlite=>'sqlite',
  TitanStorageProviderKind.awsRds=>'aws_rds',
  TitanStorageProviderKind.customerVps=>'customer_vps',
  TitanStorageProviderKind.titanManaged=>'titan_managed',
};

TitanStorageAccessMode titanStorageAccessModeFromWire(String raw){
  switch(raw){
    case 'device_local':
    case 'deviceLocal':
      return TitanStorageAccessMode.deviceLocal;
    case 'delegated_https':
    case 'delegatedHttps':
      return TitanStorageAccessMode.delegatedHttps;
    case 'local_bridge':
    case 'localBridge':
      return TitanStorageAccessMode.localBridge;
    case 'status_only':
    case 'statusOnly':
      return TitanStorageAccessMode.statusOnly;
    default:
      throw StateError(
        'unsupported Storage Fabric access mode: $raw',
      );
  }
}

String titanStorageAccessModeWire(TitanStorageAccessMode mode)=>
    switch(mode){
  TitanStorageAccessMode.deviceLocal=>'device_local',
  TitanStorageAccessMode.delegatedHttps=>'delegated_https',
  TitanStorageAccessMode.localBridge=>'local_bridge',
  TitanStorageAccessMode.statusOnly=>'status_only',
};
