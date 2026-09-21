import 'package:titan_mobile_mvp/titan/edge/storage_fabric_topology.dart';
import 'package:titan_mobile_mvp/titan/edge/storage_provider_adapter.dart';
import 'package:titan_mobile_mvp/titan/edge/storage_transfer_ticket.dart';
import 'package:titan_mobile_mvp/titan/models/titan_http_response.dart';
import 'package:titan_mobile_mvp/titan/services/titan_http_client.dart';

class FakeStorageTicketProvider
    implements TitanStorageTransferTicketProvider {
  final TitanStorageTransferTicket Function({
    required TitanStorageFabricEndpoint endpoint,
    required TitanStorageFabricRole role,
    required TitanStorageTransferOperation operation,
    required String companyId,
    required String dataClass,
    required String objectId,
    required int byteLength,
    required String sha256,
    required String contentType,
    required String operationId,
  }) builder;

  FakeStorageTicketProvider(this.builder);

  @override
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
  }) async=>builder(
    endpoint:endpoint,
    role:role,
    operation:TitanStorageTransferOperation.write,
    companyId:companyId,
    dataClass:dataClass,
    objectId:objectId,
    byteLength:byteLength,
    sha256:sha256,
    contentType:contentType,
    operationId:operationId,
  );

  @override
  Future<TitanStorageTransferTicket> prepareRead({
    required TitanStorageFabricEndpoint endpoint,
    required TitanStorageFabricRole role,
    required String companyId,
    required String dataClass,
    required String objectId,
    required String operationId,
  }) async=>builder(
    endpoint:endpoint,
    role:role,
    operation:TitanStorageTransferOperation.read,
    companyId:companyId,
    dataClass:dataClass,
    objectId:objectId,
    byteLength:0,
    sha256:'',
    contentType:'',
    operationId:operationId,
  );
}

class FakeStorageHttpClient implements TitanHttpClient {
  TitanHttpResponse getResponse;
  TitanHttpResponse putResponse;
  final List<Uri> gets=[];
  final List<Uri> puts=[];
  final List<List<int>> putBodies=[];

  FakeStorageHttpClient({
    required this.getResponse,
    required this.putResponse,
  });

  @override
  Future<TitanHttpResponse> get(
    Uri uri, {
    Map<String,String> headers=const {},
    Duration? timeout,
  }) async{
    gets.add(uri);
    return getResponse;
  }

  @override
  Future<TitanHttpResponse> putBytes(
    Uri uri, {
    required List<int> bytes,
    Map<String,String> headers=const {},
    Duration? timeout,
  }) async{
    puts.add(uri);
    putBodies.add(List<int>.from(bytes));
    return putResponse;
  }

  @override
  Future<TitanHttpResponse> postJson(
    Uri uri, {
    required Map<String,dynamic> body,
    Map<String,String> headers=const {},
    Duration? timeout,
  })=>throw UnsupportedError('not used by storage adapter tests');
}

class MemoryStorageAdapter implements TitanStorageProviderAdapter {
  @override
  final TitanStorageProviderKind provider;
  @override
  final TitanStorageAccessMode accessMode;
  @override
  final Set<TitanStorageFabricRole> supportedRoles;
  final Map<String,TitanStorageObject> objects={};
  final List<String> writes=[];
  final List<String> reads=[];

  MemoryStorageAdapter({
    required this.provider,
    this.accessMode=TitanStorageAccessMode.delegatedHttps,
    this.supportedRoles=const {
      TitanStorageFabricRole.authorisedProjection,
      TitanStorageFabricRole.cache,
      TitanStorageFabricRole.evidence,
      TitanStorageFabricRole.backup,
      TitanStorageFabricRole.archive,
    },
  });

  @override
  Future<TitanStorageTransferReceipt> write({
    required TitanStorageFabricEndpoint endpoint,
    required TitanStorageFabricRole role,
    required TitanStorageObject object,
    required String operationId,
  }) async{
    writes.add(endpoint.endpointId);
    objects[object.objectId]=object;
    return TitanStorageTransferReceipt(
      operationId:operationId,
      endpointId:endpoint.endpointId,
      role:role,
      provider:provider,
      objectRef:'memory://${endpoint.endpointId}/${object.objectId}',
      sha256:'${'a'*64}',
      byteLength:object.bytes.length,
      dataEgress:'customer_cloud',
      authorityEffect:'none',
      state:'stored',
      completedAt:DateTime.utc(2026,9,20),
    );
  }

  @override
  Future<TitanStorageReadResult> read({
    required TitanStorageFabricEndpoint endpoint,
    required TitanStorageFabricRole role,
    required String companyId,
    required String dataClass,
    required String objectId,
    required String operationId,
  }) async{
    reads.add(endpoint.endpointId);
    final object=objects[objectId]??TitanStorageObject(
      companyId:companyId,
      dataClass:dataClass,
      objectId:objectId,
      contentType:'application/octet-stream',
      bytes:const [1,2,3],
    );
    return TitanStorageReadResult(
      object:object,
      receipt:TitanStorageTransferReceipt(
        operationId:operationId,
        endpointId:endpoint.endpointId,
        role:role,
        provider:provider,
        objectRef:'memory://${endpoint.endpointId}/$objectId',
        sha256:'${'a'*64}',
        byteLength:object.bytes.length,
        dataEgress:'customer_cloud',
        authorityEffect:'none',
        state:'read',
        completedAt:DateTime.utc(2026,9,20),
      ),
    );
  }
}
