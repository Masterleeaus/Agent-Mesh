import 'package:flutter_test/flutter_test.dart';
import 'package:titan_mobile_mvp/titan/edge/mobile_storage_adapter_factory.dart';
import 'package:titan_mobile_mvp/titan/edge/storage_fabric_topology.dart';
import 'server_sync_test_support.dart';
import 'storage_fabric_test_support.dart';

void main(){
  test('default factory supports customer-controlled storage but not implicit Titan-managed storage',(){
    final registry=const TitanMobileStorageAdapterFactory().build(
      scopeKey:'c1:owner:d1:zero',
      ticketProvider:FakeStorageTicketProvider(),
      httpClient:FakeTitanHttpClient(),
    );
    for(final endpointId in [
      'phone-projection',
      's3-backup-b',
      'drive-archive',
      'nas-evidence',
    ]){
      expect(
        registry.forEndpoint(storageTopology().endpoint(endpointId)!),
        isNotNull,
        reason:endpointId,
      );
    }
    final titanManaged=TitanStorageFabricEndpoint(
      endpointId:'titan',
      companyId:'c1',
      displayName:'Titan managed',
      provider:TitanStorageProviderKind.titanManaged,
      accessMode:TitanStorageAccessMode.delegatedHttps,
      state:TitanStorageEndpointState.healthy,
      roles:const [TitanStorageFabricRole.backup],
      dataClasses:const ['jobs'],
      locality:'cloud',
      protection:'encrypted',
      residency:'configured',
      credentialMode:'delegated_ephemeral_ticket',
      mobileReadable:true,
      mobileWritable:true,
      observedAt:DateTime.now().toUtc(),
    );
    expect(registry.forEndpoint(titanManaged),isNull);
  });
}
