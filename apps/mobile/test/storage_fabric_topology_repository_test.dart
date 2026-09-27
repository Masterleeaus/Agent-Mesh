import 'package:flutter_test/flutter_test.dart';
import 'package:titan_mobile_mvp/titan/edge/storage_fabric_topology.dart';
import 'package:titan_mobile_mvp/titan/edge/storage_fabric_topology_repository.dart';
import 'secure_test_harness.dart';

TitanStorageFabricTopology topology(int sequence,String revision,String correlation)=>
    TitanStorageFabricTopology(
      companyId:'c1',
      sequence:sequence,
      revision:revision,
      correlationId:correlation,
      issuedAt:DateTime.utc(2026,9,20,10),
      endpoints:const [
        TitanStorageFabricEndpoint(
          endpointId:'db',
          companyId:'c1',
          displayName:'DB',
          provider:TitanStorageProviderKind.postgres,
          accessMode:TitanStorageAccessMode.statusOnly,
          state:TitanStorageEndpointState.healthy,
          roles:[TitanStorageFabricRole.canonical],
          dataClasses:['jobs'],
          locality:'customer',
          protection:'encrypted',
          residency:'AU',
          credentialMode:'none',
          mobileReadable:false,
          mobileWritable:false,
          observedAt:DateTime.utc(2026,9,20,10),
        ),
      ],
      routes:const [
        TitanStorageDataClassRoute(
          dataClass:'jobs',
          canonicalEndpointId:'db',
        ),
      ],
    );

void main(){
  test('storage topology replay is idempotent and sequence regression is rejected',() async{
    final harness=await TitanSecureTestHarness.create();
    addTearDown(harness.dispose);
    final repo=TitanStorageFabricTopologyRepository(
      scopeKey:'c1:owner:d1:zero',
      companyId:'c1',
      store:harness.newStateStore(),
    );
    await repo.apply(topology(1,'r1','c1'));
    await repo.apply(topology(1,'r1','c1'));
    expect((await repo.load())?.sequence,1);
    await expectLater(
      repo.apply(topology(1,'changed','c1')),
      throwsStateError,
    );
    await repo.apply(topology(2,'r2','c2'));
    await expectLater(
      repo.apply(topology(1,'r1','c1')),
      throwsStateError,
    );
  });
}
