import 'dart:io';
import 'package:flutter_test/flutter_test.dart';
import 'package:titan_mobile_mvp/titan/edge/storage_adapter_registry.dart';
import 'package:titan_mobile_mvp/titan/edge/storage_fabric_executor.dart';
import 'package:titan_mobile_mvp/titan/edge/storage_fabric_topology.dart';
import 'package:titan_mobile_mvp/titan/edge/storage_restore_staging_repository.dart';
import 'package:titan_mobile_mvp/titan/edge/storage_restore_staging_service.dart';
import 'package:titan_mobile_mvp/titan/storage/encrypted_json_store.dart';
import 'storage_fabric_test_support.dart';
import 'secure_test_harness.dart';

void main(){
  test('restore source is staged encrypted and remains authority-neutral',() async{
    final harness=await TitanSecureTestHarness.create();
    addTearDown(harness.dispose);
    final adapter=MemoryStorageAdapter(
      provider:TitanStorageProviderKind.s3,
    );
    adapter.objects['backup-1']=const TitanStorageObject(
      companyId:'c1',
      dataClass:'jobs_backup',
      objectId:'backup-1',
      contentType:'application/octet-stream',
      bytes:[80,82,73,86,65,84,69],
    );
    final topology=TitanStorageFabricTopology(
      companyId:'c1',
      sequence:1,
      revision:'r1',
      correlationId:'corr',
      issuedAt:DateTime.utc(2026,9,20),
      endpoints:const [
        TitanStorageFabricEndpoint(
          endpointId:'canonical',
          companyId:'c1',
          displayName:'Canonical objects',
          provider:TitanStorageProviderKind.s3,
          accessMode:TitanStorageAccessMode.statusOnly,
          state:TitanStorageEndpointState.degraded,
          roles:[TitanStorageFabricRole.canonical],
          dataClasses:['jobs_backup'],
          locality:'customer_cloud',
          protection:'customer_key',
          residency:'AU',
          credentialMode:'none',
          mobileReadable:false,
          mobileWritable:false,
          observedAt:DateTime.utc(2026,9,20),
        ),
        TitanStorageFabricEndpoint(
          endpointId:'backup',
          companyId:'c1',
          displayName:'Backup',
          provider:TitanStorageProviderKind.s3,
          accessMode:TitanStorageAccessMode.delegatedHttps,
          state:TitanStorageEndpointState.healthy,
          roles:[TitanStorageFabricRole.backup],
          dataClasses:['jobs_backup'],
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
          dataClass:'jobs_backup',
          kind:TitanStorageDataClassKind.object,
          canonicalEndpointId:'canonical',
          backupEndpointIds:['backup'],
          recoveryOrder:['backup'],
        ),
      ],
    );
    final repo=TitanStorageRestoreStagingRepository(
      scopeKey:'c1:owner:d1:zero',
      companyId:'c1',
      metadata:TitanEncryptedJsonStore(
        keyStore:harness.keyStore,
        rootDirectory:harness.root,
      ),
      vault:harness.newFileVault('storage-restore-test'),
    );
    final staged=await TitanStorageRestoreStagingService(
      storage:TitanStorageFabricExecutor(
        companyId:'c1',
        topology:topology,
        adapters:TitanStorageAdapterRegistry([adapter]),
      ),
      staging:repo,
    ).stage(
      restoreId:'restore-1',
      dataClass:'jobs_backup',
      objectId:'backup-1',
      operationId:'op-restore',
    );
    expect(staged.authorityEffect,'none');
    expect(staged.sourceEndpointId,'backup');
    expect(await repo.readBytes('restore-1'),
      [80,82,73,86,65,84,69]);

    final raw=harness.root.listSync(recursive:true)
        .whereType<File>()
        .map((file){
          try{return file.readAsStringSync();}catch(_){return '';}
        }).join('\n');
    expect(raw,isNot(contains('PRIVATE')));
    expect(raw,isNot(contains('backup-1')));
  });
}
