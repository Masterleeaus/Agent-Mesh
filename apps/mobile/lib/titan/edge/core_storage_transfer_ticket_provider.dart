import 'dart:convert';
import '../models/server_sync_config.dart';
import '../services/auth_retry_helper.dart';
import '../services/titan_auth_token_provider.dart';
import '../services/titan_http_client.dart';
import '../services/titan_mobile_contract_headers.dart';
import '../services/titan_server_sync_exceptions.dart';
import 'storage_fabric_topology.dart';
import 'storage_transfer_ticket.dart';

class TitanCoreStorageTransferTicketProvider
    implements TitanStorageTransferTicketProvider {
  final String companyId;
  final String actorId;
  final String deviceId;
  final String surface;
  final TitanServerSyncConfig config;
  final TitanAuthTokenProvider authTokenProvider;
  final TitanHttpClient httpClient;
  final TitanAuthRetryHelper authRetryHelper;

  const TitanCoreStorageTransferTicketProvider({
    required this.companyId,
    required this.actorId,
    required this.deviceId,
    required this.surface,
    required this.config,
    required this.authTokenProvider,
    required this.httpClient,
    this.authRetryHelper=const TitanAuthRetryHelper(),
  });

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
  })=>_prepare(
    endpoint:endpoint,
    role:role,
    companyId:companyId,
    dataClass:dataClass,
    objectId:objectId,
    operation:TitanStorageTransferOperation.write,
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
  })=>_prepare(
    endpoint:endpoint,
    role:role,
    companyId:companyId,
    dataClass:dataClass,
    objectId:objectId,
    operation:TitanStorageTransferOperation.read,
    byteLength:0,
    sha256:'',
    contentType:'',
    operationId:operationId,
  );

  Future<TitanStorageTransferTicket> _prepare({
    required TitanStorageFabricEndpoint endpoint,
    required TitanStorageFabricRole role,
    required String companyId,
    required String dataClass,
    required String objectId,
    required TitanStorageTransferOperation operation,
    required int byteLength,
    required String sha256,
    required String contentType,
    required String operationId,
  }) async{
    if(companyId!=this.companyId){
      throw StateError('storage ticket request company mismatch');
    }
    config.validate();
    var token=await authRetryHelper.token(authTokenProvider);
    if(token==null||token.isEmpty){
      throw const TitanAuthenticationRequiredException();
    }

    var response=await _post(
      token:token,
      endpoint:endpoint,
      role:role,
      companyId:companyId,
      dataClass:dataClass,
      objectId:objectId,
      operation:operation,
      byteLength:byteLength,
      sha256:sha256,
      contentType:contentType,
      operationId:operationId,
    );
    if(response.statusCode==401||response.statusCode==403){
      token=await authRetryHelper.refreshAfterUnauthorized(
        authTokenProvider,
      );
      if(token==null||token.isEmpty){
        throw const TitanAuthenticationRequiredException();
      }
      response=await _post(
        token:token,
        endpoint:endpoint,
        role:role,
        companyId:companyId,
        dataClass:dataClass,
        objectId:objectId,
        operation:operation,
        byteLength:byteLength,
        sha256:sha256,
        contentType:contentType,
        operationId:operationId,
      );
    }
    if(response.statusCode==401||response.statusCode==403){
      throw const TitanAuthenticationRequiredException();
    }
    if(response.statusCode==426){
      throw const TitanClientContractUpgradeException();
    }
    if(response.statusCode<200||response.statusCode>=300){
      throw StateError(
        'storage transfer ticket returned HTTP ${response.statusCode}',
      );
    }

    final raw=jsonDecode(response.body);
    if(raw is! Map){
      throw StateError('storage transfer ticket response is invalid');
    }
    return _fromJson(Map<String,dynamic>.from(raw));
  }

  Future<dynamic> _post({
    required String token,
    required TitanStorageFabricEndpoint endpoint,
    required TitanStorageFabricRole role,
    required String companyId,
    required String dataClass,
    required String objectId,
    required TitanStorageTransferOperation operation,
    required int byteLength,
    required String sha256,
    required String contentType,
    required String operationId,
  })=>httpClient.postJson(
    config.resolve(config.storageTransferPath),
    headers:{
      'authorization':'Bearer $token',
      'accept':'application/json',
      ...TitanMobileContractHeaders.scoped(
        companyId:companyId,
        actorId:actorId,
        deviceId:deviceId,
        surface:surface,
        correlationId:operationId,
        operationId:operationId,
      ),
      'idempotency-key':
          'storage-transfer:$operationId:${operation.name}',
    },
    body:{
      'company_id':companyId,
      'endpoint_id':endpoint.endpointId,
      'provider':titanStorageProviderWire(endpoint.provider),
      'role':titanStorageRoleWire(role),
      'operation':operation.name,
      'data_class':dataClass,
      'object_id':objectId,
      if(operation==TitanStorageTransferOperation.write)
        'byte_length':byteLength,
      if(operation==TitanStorageTransferOperation.write)
        'sha256':sha256,
      if(contentType.isNotEmpty)'content_type':contentType,
      'authority_effect':'none',
    },
    timeout:config.requestTimeout,
  );

  TitanStorageTransferTicket _fromJson(Map<String,dynamic> json){
    final provider=titanStorageProviderFromWire(
      (json['provider']??'').toString(),
    );
    final role=titanStorageRoleFromWire(
      (json['role']??'').toString(),
    );
    final operation=TitanStorageTransferOperation.values.firstWhere(
      (value)=>value.name==(json['operation']??'').toString(),
      orElse:()=>throw StateError(
        'storage transfer ticket operation invalid',
      ),
    );
    final uri=Uri.tryParse((json['url']??'').toString());
    if(uri==null){
      throw StateError('storage transfer ticket URL invalid');
    }
    return TitanStorageTransferTicket(
      ticketId:(json['ticket_id']??'').toString(),
      companyId:(json['company_id']??'').toString(),
      endpointId:(json['endpoint_id']??'').toString(),
      provider:provider,
      role:role,
      operation:operation,
      dataClass:(json['data_class']??'').toString(),
      objectId:(json['object_id']??'').toString(),
      uri:uri,
      headers:Map<String,String>.from(
        (json['headers'] as Map?)??const {},
      ),
      objectRef:(json['object_ref']??'').toString(),
      expectedSha256:(json['expected_sha256']??'').toString(),
      maxBytes:(json['max_bytes'] as num?)?.toInt()??0,
      dataEgress:(json['data_egress']??'').toString(),
      expiresAt:DateTime.tryParse(
        (json['expires_at']??'').toString(),
      )??DateTime.fromMillisecondsSinceEpoch(0),
    );
  }
}
