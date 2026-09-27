import 'storage_fabric_topology.dart';

class TitanStorageObject {
  final String companyId;
  final String dataClass;
  final String objectId;
  final String contentType;
  final List<int> bytes;
  final Map<String,String> metadata;

  const TitanStorageObject({
    required this.companyId,
    required this.dataClass,
    required this.objectId,
    required this.contentType,
    required this.bytes,
    this.metadata=const {},
  });
}

class TitanStorageTransferReceipt {
  final String operationId;
  final String endpointId;
  final TitanStorageFabricRole role;
  final TitanStorageProviderKind provider;
  final String objectRef;
  final String sha256;
  final int byteLength;
  final String dataEgress;
  final String authorityEffect;
  final String state;
  final DateTime completedAt;

  const TitanStorageTransferReceipt({
    required this.operationId,
    required this.endpointId,
    required this.role,
    required this.provider,
    required this.objectRef,
    required this.sha256,
    required this.byteLength,
    required this.dataEgress,
    required this.authorityEffect,
    required this.state,
    required this.completedAt,
  });
}

class TitanStorageReadResult {
  final TitanStorageObject object;
  final TitanStorageTransferReceipt receipt;

  const TitanStorageReadResult({
    required this.object,
    required this.receipt,
  });
}

abstract class TitanStorageProviderAdapter {
  TitanStorageProviderKind get provider;
  TitanStorageAccessMode get accessMode;
  Set<TitanStorageFabricRole> get supportedRoles;

  Future<TitanStorageTransferReceipt> write({
    required TitanStorageFabricEndpoint endpoint,
    required TitanStorageFabricRole role,
    required TitanStorageObject object,
    required String operationId,
  });

  Future<TitanStorageReadResult> read({
    required TitanStorageFabricEndpoint endpoint,
    required TitanStorageFabricRole role,
    required String companyId,
    required String dataClass,
    required String objectId,
    required String operationId,
  });
}
