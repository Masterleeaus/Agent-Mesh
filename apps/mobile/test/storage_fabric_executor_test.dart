import 'package:flutter_test/flutter_test.dart';
import 'package:titan_mobile_mvp/titan/edge/storage_adapter_registry.dart';
import 'package:titan_mobile_mvp/titan/edge/storage_fabric_executor.dart';
import 'package:titan_mobile_mvp/titan/edge/storage_fabric_topology.dart';
import 'package:titan_mobile_mvp/titan/edge/storage_provider_adapter.dart';
import 'storage_fabric_test_support.dart';

TitanStorageFabricEndpoint endpoint({
  required String id,
  required TitanStorageEndpointState state,
  required List<TitanStorageFabricRole> roles,
})=>TitanStorageFabricEndpoint(
  endpointId:id,
  companyId:'c1',
  displayName:id,
  provider:TitanStorageProviderKind.s3,
  accessMode:TitanStorageAccessMode.delegatedHttps,
  state:state,
  roles:roles,
  dataClasses:const ['jobs_backup'],
  locality:'customer_cloud',
  protection:'customer_key',
  residency:'AU',
  credentialMode:'delegated_ticket',
  allowedTransferHosts:const ['storage.test'],
  mobileReadable:true,
  mobileWritable:true,
  observedAt:DateTime.utc(2026,9,20),
);

void main(){
  test('writer skips degraded endpoint and selects healthy authorised backup',() async{
    final adapter=MemoryStorageAdapter(
      provider:TitanStorageProviderKind.s3,
    );
    final executor=TitanStorageFabricExecutor(
      companyId:'c1',
      topology:TitanStorageFabricTopology(
        companyId:'c1',
        sequence:1,
        revision:'r1',
        correlationId:'c1',
        issuedAt:DateTime.utc(2026,9,20),
        endpoints:[
          const TitanStorageFabricEndpoint(
            endpointId:'canonical',
            companyId:'c1',
            displayName:'Canonical object store',
            provider:TitanStorageProviderKind.s3,
            accessMode:TitanStorageAccessMode.statusOnly,
            state:TitanStorageEndpointState.healthy,
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
          endpoint(
            id:'backup-a',
            state:TitanStorageEndpointState.degraded,
            roles:const [TitanStorageFabricRole.backup],
          ),
          endpoint(
            id:'backup-b',
            state:TitanStorageEndpointState.healthy,
            roles:const [TitanStorageFabricRole.backup],
          ),
        ],
        routes:const [
          TitanStorageDataClassRoute(
            dataClass:'jobs_backup',
            kind:TitanStorageDataClassKind.object,
            canonicalEndpointId:'canonical',
            backupEndpointIds:['backup-a','backup-b'],
            recoveryOrder:['backup-b'],
          ),
        ],
      ),
      adapters:TitanStorageAdapterRegistry([adapter]),
    );

    final receipt=await executor.write(
      role:TitanStorageFabricRole.backup,
      object:const TitanStorageObject(
        companyId:'c1',
        dataClass:'jobs_backup',
        objectId:'b1',
        contentType:'application/octet-stream',
        bytes:[1,2,3],
      ),
      operationId:'op1',
    );
    expect(receipt.endpointId,'backup-b');
    expect(adapter.writes,['backup-b']);
  });

  test('executor never permits mobile direct canonical or replica access',() async{
    final adapter=MemoryStorageAdapter(
      provider:TitanStorageProviderKind.s3,
      supportedRoles:const {
        TitanStorageFabricRole.canonical,
        TitanStorageFabricRole.replica,
      },
    );
    final executor=TitanStorageFabricExecutor(
      companyId:'c1',
      topology:TitanStorageFabricTopology(
        companyId:'c1',
        sequence:1,
        revision:'r1',
        correlationId:'c1',
        issuedAt:DateTime.utc(2026,9,20),
        endpoints:const [
          TitanStorageFabricEndpoint(
            endpointId:'canonical',
            companyId:'c1',
            displayName:'Canonical object store',
            provider:TitanStorageProviderKind.s3,
            accessMode:TitanStorageAccessMode.statusOnly,
            state:TitanStorageEndpointState.healthy,
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
        ],
        routes:const [
          TitanStorageDataClassRoute(
            dataClass:'jobs_backup',
            kind:TitanStorageDataClassKind.object,
            canonicalEndpointId:'canonical',
          ),
        ],
      ),
      adapters:TitanStorageAdapterRegistry([adapter]),
    );
    await expectLater(
      executor.write(
        role:TitanStorageFabricRole.canonical,
        object:const TitanStorageObject(
          companyId:'c1',
          dataClass:'jobs_backup',
          objectId:'o1',
          contentType:'application/octet-stream',
          bytes:[1],
        ),
        operationId:'op',
      ),
      throwsStateError,
    );
  });

  test('restore follows authorised recovery order and never promotes canonical',() async{
    final s3=MemoryStorageAdapter(
      provider:TitanStorageProviderKind.s3,
    );
    final drive=MemoryStorageAdapter(
      provider:TitanStorageProviderKind.googleDrive,
    );
    final executor=TitanStorageFabricExecutor(
      companyId:'c1',
      topology:TitanStorageFabricTopology(
        companyId:'c1',
        sequence:1,
        revision:'r1',
        correlationId:'c1',
        issuedAt:DateTime.utc(2026,9,20),
        endpoints:[
          const TitanStorageFabricEndpoint(
            endpointId:'canonical',
            companyId:'c1',
            displayName:'Canonical object store',
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
            endpointId:'archive',
            companyId:'c1',
            displayName:'Archive',
            provider:TitanStorageProviderKind.googleDrive,
            accessMode:TitanStorageAccessMode.delegatedHttps,
            state:TitanStorageEndpointState.unavailable,
            roles:const [TitanStorageFabricRole.archive],
            dataClasses:const ['jobs_backup'],
            locality:'customer_cloud',
            protection:'encrypted',
            residency:'AU',
            credentialMode:'delegated_ticket',
            allowedTransferHosts:const ['drive.test'],
            mobileReadable:true,
            mobileWritable:true,
            observedAt:DateTime.utc(2026,9,20),
          ),
          endpoint(
            id:'backup',
            state:TitanStorageEndpointState.healthy,
            roles:const [TitanStorageFabricRole.backup],
          ),
        ],
        routes:const [
          TitanStorageDataClassRoute(
            dataClass:'jobs_backup',
            kind:TitanStorageDataClassKind.object,
            canonicalEndpointId:'canonical',
            backupEndpointIds:['backup'],
            archiveEndpointIds:['archive'],
            recoveryOrder:['archive','backup'],
          ),
        ],
      ),
      adapters:TitanStorageAdapterRegistry([s3,drive]),
    );
    final result=await executor.stageRestore(
      dataClass:'jobs_backup',
      objectId:'b1',
      operationId:'restore1',
    );
    expect(result.receipt.endpointId,'backup');
    expect(result.receipt.authorityEffect,'none');
  });
}
