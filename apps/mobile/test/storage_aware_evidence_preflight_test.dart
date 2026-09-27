import 'package:flutter_test/flutter_test.dart';
import 'package:titan_mobile_mvp/titan/edge/storage_aware_evidence_preflight.dart';
import 'package:titan_mobile_mvp/titan/edge/storage_fabric_topology.dart';
import 'package:titan_mobile_mvp/titan/edge/storage_fabric_topology_repository.dart';
import 'package:titan_mobile_mvp/titan/services/evidence_upload_preflight.dart';
import 'secure_test_harness.dart';

class _Preflight implements TitanEvidenceUploadPreflight {
  int calls=0;
  @override
  Future<String> ensureUploaded(String evidenceId) async{
    calls++;
    return 'remote:$evidenceId';
  }

  @override
  Future<void> markServerConfirmed(Iterable<String> evidenceIds) async{}
}

void main(){
  test('evidence stays staged when canonical topology has no healthy evidence ingress',() async{
    final harness=await TitanSecureTestHarness.create();
    addTearDown(harness.dispose);
    final repo=TitanStorageFabricTopologyRepository(
      scopeKey:'c1:w1:d1:go',
      companyId:'c1',
      store:harness.newStateStore(),
    );
    await repo.apply(TitanStorageFabricTopology(
      companyId:'c1',
      sequence:1,
      revision:'r1',
      correlationId:'corr',
      issuedAt:DateTime.now().toUtc(),
      endpoints:const [
        TitanStorageFabricEndpoint(
          endpointId:'canonical',
          companyId:'c1',
          displayName:'Canonical evidence',
          provider:TitanStorageProviderKind.s3,
          accessMode:TitanStorageAccessMode.statusOnly,
          state:TitanStorageEndpointState.healthy,
          roles:[TitanStorageFabricRole.canonical],
          dataClasses:['field_evidence'],
          locality:'cloud',
          protection:'encrypted',
          residency:'AU',
          credentialMode:'none',
          mobileReadable:false,
          mobileWritable:false,
          observedAt:DateTime.utc(2026,9,20),
        ),
      ],
      routes:const [
        TitanStorageDataClassRoute(
          dataClass:'field_evidence',
          kind:TitanStorageDataClassKind.object,
          canonicalEndpointId:'canonical',
        ),
      ],
    ));
    final delegate=_Preflight();
    final preflight=TitanStorageAwareEvidenceUploadPreflight(
      delegate:delegate,
      topologyRepository:repo,
    );
    await expectLater(
      preflight.ensureUploaded('e1'),
      throwsStateError,
    );
    expect(delegate.calls,0);
  });
}
