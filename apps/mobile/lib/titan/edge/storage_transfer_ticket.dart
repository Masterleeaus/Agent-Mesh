import 'storage_fabric_topology.dart';

enum TitanStorageTransferOperation {
  write,
  read,
}

class TitanStorageTransferTicket {
  final String ticketId;
  final String companyId;
  final String endpointId;
  final TitanStorageProviderKind provider;
  final TitanStorageFabricRole role;
  final TitanStorageTransferOperation operation;
  final String dataClass;
  final String objectId;
  final Uri uri;
  final Map<String,String> headers;
  final String objectRef;
  final String expectedSha256;
  final int maxBytes;
  final String dataEgress;
  final DateTime expiresAt;

  const TitanStorageTransferTicket({
    required this.ticketId,
    required this.companyId,
    required this.endpointId,
    required this.provider,
    required this.role,
    required this.operation,
    required this.dataClass,
    required this.objectId,
    required this.uri,
    required this.headers,
    required this.objectRef,
    required this.expectedSha256,
    required this.maxBytes,
    required this.dataEgress,
    required this.expiresAt,
  });
}

abstract class TitanStorageTransferTicketProvider {
  Future<TitanStorageTransferTicket> prepareWrite({
    required TitanStorageFabricEndpoint endpoint,
    required TitanStorageFabricRole role,
    required String companyId,
    required String dataClass,
    required String objectId,
    required int byteLength,
    required String sha256,
    required String contentType,
    required String operationId,
  });

  Future<TitanStorageTransferTicket> prepareRead({
    required TitanStorageFabricEndpoint endpoint,
    required TitanStorageFabricRole role,
    required String companyId,
    required String dataClass,
    required String objectId,
    required String operationId,
  });
}
