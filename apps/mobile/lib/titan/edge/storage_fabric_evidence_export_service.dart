import '../services/evidence_vault_repository.dart';
import 'storage_fabric_executor.dart';
import 'storage_fabric_topology.dart';
import 'storage_provider_adapter.dart';

class TitanStorageFabricEvidenceExportService {
  final String companyId;
  final EvidenceVaultRepository evidence;
  final TitanStorageFabricExecutor storage;

  const TitanStorageFabricEvidenceExportService({
    required this.companyId,
    required this.evidence,
    required this.storage,
  });

  Future<TitanStorageTransferReceipt> export({
    required String evidenceId,
    required String operationId,
    String contentType='application/octet-stream',
  }) async{
    final bytes=await evidence.readBytes(evidenceId);
    if(bytes.isEmpty){
      throw StateError('evidence payload is empty');
    }
    return storage.write(
      role:TitanStorageFabricRole.evidence,
      object:TitanStorageObject(
        companyId:companyId,
        dataClass:'field_evidence',
        objectId:evidenceId,
        contentType:contentType,
        bytes:bytes,
      ),
      operationId:operationId,
    );
  }
}
