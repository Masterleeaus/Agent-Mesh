import 'dart:io';
import 'package:flutter_test/flutter_test.dart';
import 'package:titan_mobile_mvp/titan/edge/device_encrypted_storage_adapter.dart';
import 'package:titan_mobile_mvp/titan/edge/storage_fabric_topology.dart';
import 'package:titan_mobile_mvp/titan/edge/storage_provider_adapter.dart';
import 'secure_test_harness.dart';

void main(){
  test('device-local Storage Fabric object is encrypted at rest and round trips',() async{
    final harness=await TitanSecureTestHarness.create();
    addTearDown(harness.dispose);
    final adapter=TitanDeviceEncryptedStorageAdapter(
      scopeKey:'c1:owner:d1:zero',
      vault:harness.newFileVault('storage-object-test'),
    );
    final endpoint=TitanStorageFabricEndpoint(
      endpointId:'device-cache',
      companyId:'c1',
      displayName:'This device',
      nodeId:'mobile-1',
      provider:TitanStorageProviderKind.deviceEncrypted,
      accessMode:TitanStorageAccessMode.deviceLocal,
      state:TitanStorageEndpointState.healthy,
      roles:const [TitanStorageFabricRole.cache],
      dataClasses:const ['job_projection'],
      locality:'device',
      protection:'aes-256-gcm',
      residency:'device',
      credentialMode:'secure_store',
      mobileReadable:true,
      mobileWritable:true,
      observedAt:DateTime.utc(2026,9,20),
    );
    final bytes='PRIVATE-STORAGE-MARKER-123'.codeUnits;
    final receipt=await adapter.write(
      endpoint:endpoint,
      role:TitanStorageFabricRole.cache,
      object:TitanStorageObject(
        companyId:'c1',
        dataClass:'job_projection',
        objectId:'job-1',
        contentType:'application/json',
        bytes:bytes,
      ),
      operationId:'op1',
    );
    expect(receipt.dataEgress,'none');
    expect(receipt.authorityEffect,'none');
    final files=harness.root.listSync(recursive:true)
        .whereType<File>()
        .where((file)=>file.path.endsWith('.tze'))
        .toList();
    expect(files,isNotEmpty);
    final raw=files.map((f)=>f.readAsStringSync()).join('\n');
    expect(raw,isNot(contains('PRIVATE-STORAGE-MARKER-123')));

    final read=await adapter.read(
      endpoint:endpoint,
      role:TitanStorageFabricRole.cache,
      companyId:'c1',
      dataClass:'job_projection',
      objectId:'job-1',
      operationId:'op2',
    );
    expect(String.fromCharCodes(read.object.bytes),
      'PRIVATE-STORAGE-MARKER-123');
  });

  test('device adapter refuses canonical/replica authority',() async{
    final harness=await TitanSecureTestHarness.create();
    addTearDown(harness.dispose);
    final adapter=TitanDeviceEncryptedStorageAdapter(
      scopeKey:'c1:owner:d1:zero',
      vault:harness.newFileVault('storage-object-test-2'),
    );
    final endpoint=TitanStorageFabricEndpoint(
      endpointId:'device',
      companyId:'c1',
      displayName:'Device',
      provider:TitanStorageProviderKind.deviceEncrypted,
      accessMode:TitanStorageAccessMode.deviceLocal,
      state:TitanStorageEndpointState.healthy,
      roles:const [TitanStorageFabricRole.canonical],
      dataClasses:const ['jobs'],
      locality:'device',
      protection:'encrypted',
      residency:'device',
      credentialMode:'secure_store',
      mobileReadable:true,
      mobileWritable:true,
      observedAt:DateTime.utc(2026,9,20),
    );
    await expectLater(
      adapter.write(
        endpoint:endpoint,
        role:TitanStorageFabricRole.canonical,
        object:const TitanStorageObject(
          companyId:'c1',
          dataClass:'jobs',
          objectId:'j1',
          contentType:'application/json',
          bytes:[1],
        ),
        operationId:'op',
      ),
      throwsStateError,
    );
  });
}
