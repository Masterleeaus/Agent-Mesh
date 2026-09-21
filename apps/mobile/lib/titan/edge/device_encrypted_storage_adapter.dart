import 'package:cryptography/cryptography.dart';
import '../storage/encrypted_file_vault.dart';
import 'storage_fabric_topology.dart';
import 'storage_provider_adapter.dart';

class TitanDeviceEncryptedStorageAdapter
    implements TitanStorageProviderAdapter {
  final String scopeKey;
  @override
  final TitanStorageProviderKind provider;
  final TitanEncryptedFileVault vault;

  TitanDeviceEncryptedStorageAdapter({
    required this.scopeKey,
    this.provider=TitanStorageProviderKind.deviceEncrypted,
    TitanEncryptedFileVault? vault,
  }):assert(
       provider==TitanStorageProviderKind.deviceEncrypted||
       provider==TitanStorageProviderKind.localFilesystem,
     ),
     vault=vault??TitanEncryptedFileVault(
       scopeKey:'storage-object::${provider.name}::$scopeKey',
     );

  @override
  TitanStorageAccessMode get accessMode=>
      TitanStorageAccessMode.deviceLocal;

  @override
  Set<TitanStorageFabricRole> get supportedRoles=>const {
    TitanStorageFabricRole.authorisedProjection,
    TitanStorageFabricRole.cache,
    TitanStorageFabricRole.evidence,
    TitanStorageFabricRole.backup,
    TitanStorageFabricRole.archive,
  };

  @override
  Future<TitanStorageTransferReceipt> write({
    required TitanStorageFabricEndpoint endpoint,
    required TitanStorageFabricRole role,
    required TitanStorageObject object,
    required String operationId,
  }) async{
    _validate(endpoint,role,write:true);
    if(object.companyId!=endpoint.companyId){
      throw StateError('device storage company mismatch');
    }
    final logicalId=_logicalId(
      object.companyId,
      object.dataClass,
      object.objectId,
    );
    await vault.writeBytes(
      bytes:object.bytes,
      objectId:logicalId,
    );
    final sha=await _sha256(object.bytes);
    return TitanStorageTransferReceipt(
      operationId:operationId,
      endpointId:endpoint.endpointId,
      role:role,
      provider:provider,
      objectRef:'device-encrypted://${endpoint.endpointId}/$logicalId',
      sha256:sha,
      byteLength:object.bytes.length,
      dataEgress:'none',
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
    _validate(endpoint,role,write:false);
    if(companyId!=endpoint.companyId){
      throw StateError('device storage read company mismatch');
    }
    final logicalId=_logicalId(companyId,dataClass,objectId);
    final bytes=await vault.readObject(logicalId);
    final sha=await _sha256(bytes);
    return TitanStorageReadResult(
      object:TitanStorageObject(
        companyId:companyId,
        dataClass:dataClass,
        objectId:objectId,
        contentType:'application/octet-stream',
        bytes:bytes,
      ),
      receipt:TitanStorageTransferReceipt(
        operationId:operationId,
        endpointId:endpoint.endpointId,
        role:role,
        provider:provider,
        objectRef:'device-encrypted://${endpoint.endpointId}/$logicalId',
        sha256:sha,
        byteLength:bytes.length,
        dataEgress:'none',
        authorityEffect:'none',
        state:'read',
        completedAt:DateTime.now().toUtc(),
      ),
    );
  }

  void _validate(
    TitanStorageFabricEndpoint endpoint,
    TitanStorageFabricRole role, {
    required bool write,
  }){
    if(endpoint.provider!=provider||
        endpoint.accessMode!=TitanStorageAccessMode.deviceLocal){
      throw StateError('device storage endpoint/adapter mismatch');
    }
    if(!supportedRoles.contains(role)||!endpoint.roles.contains(role)){
      throw StateError('device storage role is not executable');
    }
    if(role==TitanStorageFabricRole.canonical||
        role==TitanStorageFabricRole.replica){
      throw StateError(
        'mobile device storage cannot become canonical/replica database',
      );
    }
    if(write&&!endpoint.mobileWritable){
      throw StateError('device storage endpoint is not writable');
    }
    if(!write&&!endpoint.mobileReadable){
      throw StateError('device storage endpoint is not readable');
    }
    if(endpoint.state!=TitanStorageEndpointState.healthy){
      throw StateError('device storage endpoint is not healthy');
    }
  }

  String _logicalId(
    String companyId,
    String dataClass,
    String objectId,
  )=>'${Uri.encodeComponent(companyId)}::'
      '${Uri.encodeComponent(dataClass)}::'
      '${Uri.encodeComponent(objectId)}';

  Future<String> _sha256(List<int> bytes) async{
    final digest=await Sha256().hash(bytes);
    return digest.bytes
        .map((byte)=>byte.toRadixString(16).padLeft(2,'0'))
        .join();
  }
}
