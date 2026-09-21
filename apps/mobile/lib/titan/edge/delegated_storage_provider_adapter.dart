import 'package:cryptography/cryptography.dart';
import '../services/titan_http_client.dart';
import 'storage_fabric_topology.dart';
import 'storage_provider_adapter.dart';
import 'storage_transfer_ticket.dart';
import 'storage_transfer_ticket_validator.dart';

class TitanDelegatedStorageProviderAdapter
    implements TitanStorageProviderAdapter {
  @override
  final TitanStorageProviderKind provider;
  final TitanStorageTransferTicketProvider tickets;
  final TitanHttpClient httpClient;
  final Duration timeout;
  final TitanStorageTransferTicketValidator validator;
  final Set<TitanStorageFabricRole> _roles;

  TitanDelegatedStorageProviderAdapter({
    required this.provider,
    required this.tickets,
    required this.httpClient,
    Set<TitanStorageFabricRole>? roles,
    this.timeout=const Duration(seconds:60),
    this.validator=const TitanStorageTransferTicketValidator(),
  }):_roles=roles??const {
       TitanStorageFabricRole.authorisedProjection,
       TitanStorageFabricRole.evidence,
       TitanStorageFabricRole.backup,
       TitanStorageFabricRole.archive,
     };

  @override
  TitanStorageAccessMode get accessMode=>
      TitanStorageAccessMode.delegatedHttps;

  @override
  Set<TitanStorageFabricRole> get supportedRoles=>_roles;

  @override
  Future<TitanStorageTransferReceipt> write({
    required TitanStorageFabricEndpoint endpoint,
    required TitanStorageFabricRole role,
    required TitanStorageObject object,
    required String operationId,
  }) async{
    _validateEndpoint(endpoint,role,write:true);
    if(object.companyId!=endpoint.companyId){
      throw StateError('storage object company mismatch');
    }
    if(!endpoint.supportsDataClass(object.dataClass)){
      throw StateError('storage endpoint does not support data class');
    }
    final sha256=await _sha256(object.bytes);
    final ticket=await tickets.prepareWrite(
      endpoint:endpoint,
      role:role,
      companyId:object.companyId,
      dataClass:object.dataClass,
      objectId:object.objectId,
      byteLength:object.bytes.length,
      sha256:sha256,
      contentType:object.contentType,
      operationId:operationId,
    );
    validator.validate(
      ticket:ticket,
      endpoint:endpoint,
      role:role,
      companyId:object.companyId,
      dataClass:object.dataClass,
      objectId:object.objectId,
      operation:TitanStorageTransferOperation.write,
      now:DateTime.now().toUtc(),
    );
    if(ticket.maxBytes<object.bytes.length){
      throw StateError('storage object exceeds ticket size limit');
    }
    if(ticket.expectedSha256.isNotEmpty&&
        ticket.expectedSha256.toLowerCase()!=sha256.toLowerCase()){
      throw StateError('storage write ticket digest mismatch');
    }
    final response=await httpClient.putBytes(
      ticket.uri,
      bytes:object.bytes,
      headers:ticket.headers,
      timeout:timeout,
    );
    if(response.statusCode<200||response.statusCode>=300){
      throw StateError(
        'delegated storage write returned HTTP ${response.statusCode}',
      );
    }
    return TitanStorageTransferReceipt(
      operationId:operationId,
      endpointId:endpoint.endpointId,
      role:role,
      provider:provider,
      objectRef:ticket.objectRef,
      sha256:sha256,
      byteLength:object.bytes.length,
      dataEgress:ticket.dataEgress,
      authorityEffect:'none',
      state:'stored',
      completedAt:DateTime.now().toUtc(),
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
    _validateEndpoint(endpoint,role,write:false);
    if(companyId!=endpoint.companyId){
      throw StateError('storage read company mismatch');
    }
    if(!endpoint.supportsDataClass(dataClass)){
      throw StateError('storage endpoint does not support data class');
    }
    final ticket=await tickets.prepareRead(
      endpoint:endpoint,
      role:role,
      companyId:companyId,
      dataClass:dataClass,
      objectId:objectId,
      operationId:operationId,
    );
    validator.validate(
      ticket:ticket,
      endpoint:endpoint,
      role:role,
      companyId:companyId,
      dataClass:dataClass,
      objectId:objectId,
      operation:TitanStorageTransferOperation.read,
      now:DateTime.now().toUtc(),
    );
    final response=await httpClient.get(
      ticket.uri,
      headers:ticket.headers,
      timeout:timeout,
    );
    if(response.statusCode<200||response.statusCode>=300){
      throw StateError(
        'delegated storage read returned HTTP ${response.statusCode}',
      );
    }
    if(response.bodyBytes.length>ticket.maxBytes){
      throw StateError('delegated storage read exceeded ticket size limit');
    }
    final sha256=await _sha256(response.bodyBytes);
    if(ticket.expectedSha256.isNotEmpty&&
        ticket.expectedSha256.toLowerCase()!=sha256.toLowerCase()){
      throw StateError('delegated storage read digest mismatch');
    }
    final contentType=response.headers['content-type']??
        response.headers['Content-Type']??
        'application/octet-stream';
    final object=TitanStorageObject(
      companyId:companyId,
      dataClass:dataClass,
      objectId:objectId,
      contentType:contentType,
      bytes:response.bodyBytes,
    );
    return TitanStorageReadResult(
      object:object,
      receipt:TitanStorageTransferReceipt(
        operationId:operationId,
        endpointId:endpoint.endpointId,
        role:role,
        provider:provider,
        objectRef:ticket.objectRef,
        sha256:sha256,
        byteLength:response.bodyBytes.length,
        dataEgress:ticket.dataEgress,
        authorityEffect:'none',
        state:'read',
        completedAt:DateTime.now().toUtc(),
      ),
    );
  }

  void _validateEndpoint(
    TitanStorageFabricEndpoint endpoint,
    TitanStorageFabricRole role, {
    required bool write,
  }){
    if(endpoint.provider!=provider){
      throw StateError('storage adapter provider mismatch');
    }
    if(endpoint.accessMode!=TitanStorageAccessMode.delegatedHttps){
      throw StateError('storage endpoint access mode mismatch');
    }
    if(!supportedRoles.contains(role)||
        !endpoint.roles.contains(role)){
      throw StateError('storage role not executable by adapter');
    }
    if(role==TitanStorageFabricRole.canonical||
        role==TitanStorageFabricRole.replica){
      throw StateError(
        'mobile cannot execute direct canonical/replica storage writes',
      );
    }
    if(write&&!endpoint.mobileWritable){
      throw StateError('storage endpoint is not mobile writable');
    }
    if(!write&&!endpoint.mobileReadable){
      throw StateError('storage endpoint is not mobile readable');
    }
    if(endpoint.state!=TitanStorageEndpointState.healthy){
      throw StateError('storage endpoint is not healthy');
    }
  }

  Future<String> _sha256(List<int> bytes) async{
    final digest=await Sha256().hash(bytes);
    return digest.bytes
        .map((byte)=>byte.toRadixString(16).padLeft(2,'0'))
        .join();
  }
}
