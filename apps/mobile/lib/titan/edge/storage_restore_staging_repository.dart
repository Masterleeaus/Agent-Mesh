import '../storage/encrypted_file_vault.dart';
import '../storage/encrypted_json_store.dart';
import 'storage_fabric_topology.dart';
import 'storage_provider_adapter.dart';

class TitanStagedStorageRestore {
  final String restoreId;
  final String companyId;
  final String dataClass;
  final String objectId;
  final String sourceEndpointId;
  final TitanStorageProviderKind provider;
  final String sha256;
  final int byteLength;
  final String encryptedObjectId;
  final String authorityEffect;
  final DateTime stagedAt;

  const TitanStagedStorageRestore({
    required this.restoreId,
    required this.companyId,
    required this.dataClass,
    required this.objectId,
    required this.sourceEndpointId,
    required this.provider,
    required this.sha256,
    required this.byteLength,
    required this.encryptedObjectId,
    this.authorityEffect='none',
    required this.stagedAt,
  });

  factory TitanStagedStorageRestore.fromJson(
    Map<String,dynamic> json,
  )=>TitanStagedStorageRestore(
    restoreId:(json['restore_id']??'').toString(),
    companyId:(json['company_id']??'').toString(),
    dataClass:(json['data_class']??'').toString(),
    objectId:(json['object_id']??'').toString(),
    sourceEndpointId:(json['source_endpoint_id']??'').toString(),
    provider:TitanStorageProviderKind.values.firstWhere(
      (value)=>value.name==(json['provider']??'').toString(),
      orElse:()=>throw StateError('unknown staged restore provider'),
    ),
    sha256:(json['sha256']??'').toString(),
    byteLength:(json['byte_length'] as num?)?.toInt()??0,
    encryptedObjectId:(json['encrypted_object_id']??'').toString(),
    authorityEffect:(json['authority_effect']??'none').toString(),
    stagedAt:DateTime.tryParse(
      (json['staged_at']??'').toString(),
    )??DateTime.fromMillisecondsSinceEpoch(0),
  );

  Map<String,dynamic> toJson()=> {
    'restore_id':restoreId,
    'company_id':companyId,
    'data_class':dataClass,
    'object_id':objectId,
    'source_endpoint_id':sourceEndpointId,
    'provider':provider.name,
    'sha256':sha256,
    'byte_length':byteLength,
    'encrypted_object_id':encryptedObjectId,
    'authority_effect':authorityEffect,
    'staged_at':stagedAt.toUtc().toIso8601String(),
  };
}

class TitanStorageRestoreStagingRepository {
  final String scopeKey;
  final String companyId;
  final TitanEncryptedJsonStore metadata;
  final TitanEncryptedFileVault vault;

  TitanStorageRestoreStagingRepository({
    required this.scopeKey,
    required this.companyId,
    TitanEncryptedJsonStore? metadata,
    TitanEncryptedFileVault? vault,
  }):metadata=metadata??TitanEncryptedJsonStore(),
     vault=vault??TitanEncryptedFileVault(
       scopeKey:'storage-restore::$scopeKey',
     );

  String get _key=>'edge.storage.restore.staging.v1::$scopeKey';

  Future<TitanStagedStorageRestore> stage({
    required String restoreId,
    required String dataClass,
    required String objectId,
    required TitanStorageReadResult read,
  }) async{
    if(read.object.companyId!=companyId||
        read.receipt.authorityEffect!='none'){
      throw StateError('restore staging authority/company mismatch');
    }
    if(read.receipt.sha256.trim().isEmpty||
        read.receipt.byteLength!=read.object.bytes.length){
      throw StateError('restore staging receipt incomplete');
    }
    final encryptedObjectId='$restoreId::$dataClass::$objectId';
    await vault.writeBytes(
      bytes:read.object.bytes,
      objectId:encryptedObjectId,
    );
    final item=TitanStagedStorageRestore(
      restoreId:restoreId,
      companyId:companyId,
      dataClass:dataClass,
      objectId:objectId,
      sourceEndpointId:read.receipt.endpointId,
      provider:read.receipt.provider,
      sha256:read.receipt.sha256,
      byteLength:read.receipt.byteLength,
      encryptedObjectId:encryptedObjectId,
      stagedAt:DateTime.now().toUtc(),
    );
    final rows=await all();
    await metadata.writeList(
      _key,
      [
        ...rows.where((row)=>row.restoreId!=restoreId),
        item,
      ].map((row)=>row.toJson()).toList(),
    );
    return item;
  }

  Future<List<TitanStagedStorageRestore>> all() async{
    final rows=await metadata.readList(_key)??const [];
    return rows
        .map((row)=>TitanStagedStorageRestore.fromJson(
          Map<String,dynamic>.from(row as Map),
        ))
        .where((row)=>row.companyId==companyId)
        .toList(growable:false);
  }

  Future<List<int>> readBytes(String restoreId) async{
    final item=(await all()).firstWhere(
      (row)=>row.restoreId==restoreId,
      orElse:()=>throw StateError('staged restore not found'),
    );
    return vault.readObject(item.encryptedObjectId);
  }

  Future<void> remove(String restoreId) async{
    final rows=await all();
    for(final row in rows.where((item)=>item.restoreId==restoreId)){
      await vault.deleteObject(row.encryptedObjectId);
    }
    await metadata.writeList(
      _key,
      rows.where((row)=>row.restoreId!=restoreId)
          .map((row)=>row.toJson())
          .toList(),
    );
  }
}
