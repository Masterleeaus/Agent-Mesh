import 'storage_fabric_executor.dart';
import 'storage_restore_staging_repository.dart';

class TitanStorageRestoreStagingService {
  final TitanStorageFabricExecutor storage;
  final TitanStorageRestoreStagingRepository staging;

  const TitanStorageRestoreStagingService({
    required this.storage,
    required this.staging,
  });

  Future<TitanStagedStorageRestore> stage({
    required String restoreId,
    required String dataClass,
    required String objectId,
    required String operationId,
  }) async{
    final read=await storage.stageRestore(
      dataClass:dataClass,
      objectId:objectId,
      operationId:operationId,
    );
    return staging.stage(
      restoreId:restoreId,
      dataClass:dataClass,
      objectId:objectId,
      read:read,
    );
  }
}
