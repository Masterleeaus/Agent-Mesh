import 'dart:io';
import 'package:flutter_test/flutter_test.dart';
import 'package:titan_mobile_mvp/titan/edge/storage_adapter_registry.dart';
import 'package:titan_mobile_mvp/titan/edge/storage_fabric_evidence_export_service.dart';
import 'package:titan_mobile_mvp/titan/edge/storage_fabric_executor.dart';
import 'package:titan_mobile_mvp/titan/edge/storage_fabric_topology.dart';
import 'package:titan_mobile_mvp/titan/models/evidence_item.dart';
import 'package:titan_mobile_mvp/titan/services/evidence_vault_repository.dart';
import 'storage_fabric_test_support.dart';
import 'secure_test_harness.dart';

void main(){
  test('evidence export uses authorised evidence role and decrypted bytes only in-memory',() async{
    final harness=await TitanSecureTestHarness.create();
    addTearDown(harness.dispose);
    final plaintext=File('${harness.root.path}/capture.tmp');
    await plaintext.writeAsBytes([9,8,7,6],flush:true);
    final evidence=EvidenceVaultRepository(
      scopeKey:'c1:w1:d1:go',
      encryptedStore:harness.newStateStore(),
      fileVault:harness.newFileVault('evidence-export'),
    );
    await evidence.importSource(TitanEvidenceItem(
      id:'e1',
      jobId:'j1',
      kind:TitanEvidenceKind.photo,
      localPath:plaintext.path,
      createdAt:DateTime.utc(2026,9,20),
    ));
    expect(await plaintext.exists(),isFalse);

    final adapter=MemoryStorageAdapter(
      provider:TitanStorageProviderKind.s3,
    );
    final topology=TitanStorageFabricTopology(
      companyId:'c1',
      sequence:1,
      revision:'r1',
      correlationId:'corr',
      issuedAt:DateTime.utc(2026,9,20),
      endpoints:const [
        TitanStorageFabricEndpoint(
          endpointId:'evidence-canonical',
          companyId:'c1',
          displayName:'Canonical evidence',
          provider:TitanStorageProviderKind.s3,
          accessMode:TitanStorageAccessMode.statusOnly,
          state:TitanStorageEndpointState.healthy,
          roles:[TitanStorageFabricRole.canonical],
          dataClasses:['field_evidence'],
          locality:'customer_cloud',
          protection:'customer_key',
          residency:'AU',
          credentialMode:'none',
          mobileReadable:false,
          mobileWritable:false,
          observedAt:DateTime.utc(2026,9,20),
        ),
        TitanStorageFabricEndpoint(
          endpointId:'evidence-upload',
          companyId:'c1',
          displayName:'Evidence ingress',
          provider:TitanStorageProviderKind.s3,
          accessMode:TitanStorageAccessMode.delegatedHttps,
          state:TitanStorageEndpointState.healthy,
          roles:[TitanStorageFabricRole.evidence],
          dataClasses:['field_evidence'],
          locality:'customer_cloud',
          protection:'customer_key',
          residency:'AU',
          credentialMode:'delegated_ticket',
          allowedTransferHosts:['storage.test'],
          mobileReadable:true,
          mobileWritable:true,
          observedAt:DateTime.utc(2026,9,20),
        ),
      ],
      routes:const [
        TitanStorageDataClassRoute(
          dataClass:'field_evidence',
          kind:TitanStorageDataClassKind.object,
          canonicalEndpointId:'evidence-canonical',
          evidenceEndpointIds:['evidence-upload'],
        ),
      ],
    );
    final receipt=await TitanStorageFabricEvidenceExportService(
      companyId:'c1',
      evidence:evidence,
      storage:TitanStorageFabricExecutor(
        companyId:'c1',
        topology:topology,
        adapters:TitanStorageAdapterRegistry([adapter]),
      ),
    ).export(
      evidenceId:'e1',
      operationId:'evidence-op',
      contentType:'image/jpeg',
    );
    expect(receipt.endpointId,'evidence-upload');
    expect(adapter.objects['e1']?.bytes,[9,8,7,6]);
    expect(receipt.authorityEffect,'none');
  });
}
