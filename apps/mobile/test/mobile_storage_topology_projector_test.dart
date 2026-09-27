import 'package:flutter_test/flutter_test.dart';
import 'package:titan_mobile_mvp/titan/edge/mobile_storage_topology_projector.dart';
import 'package:titan_mobile_mvp/titan/edge/storage_fabric_topology.dart';
import 'package:titan_mobile_mvp/titan/edge/edge_storage_manifest.dart';

void main(){
  test('canonical topology projects only bounded device roles onto matching node',(){
    final topology=TitanStorageFabricTopology(
      companyId:'c1',
      sequence:1,
      revision:'r1',
      correlationId:'corr',
      issuedAt:DateTime.utc(2026,9,20),
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
          locality:'office',
          protection:'encrypted',
          residency:'AU',
          credentialMode:'none',
          mobileReadable:false,
          mobileWritable:false,
          observedAt:DateTime.utc(2026,9,20),
        ),
        TitanStorageFabricEndpoint(
          endpointId:'device-jobs',
          companyId:'c1',
          displayName:'Phone projection',
          nodeId:'mobile-1',
          provider:TitanStorageProviderKind.deviceEncrypted,
          accessMode:TitanStorageAccessMode.deviceLocal,
          state:TitanStorageEndpointState.healthy,
          roles:[TitanStorageFabricRole.authorisedProjection],
          dataClasses:['jobs'],
          locality:'device',
          protection:'aes-256-gcm',
          residency:'device',
          credentialMode:'secure_store',
          mobileReadable:true,
          mobileWritable:true,
          observedAt:DateTime.utc(2026,9,20),
        ),
      ],
      routes:const [
        TitanStorageDataClassRoute(
          dataClass:'jobs',
          canonicalEndpointId:'db',
          authorisedProjectionEndpointIds:['device-jobs'],
        ),
      ],
    );
    final manifest=const TitanMobileStorageTopologyProjector().project(
      topology:topology,
      companyId:'c1',
      nodeId:'mobile-1',
      surface:'zero',
      now:DateTime.utc(2026,9,20),
    );
    final jobs=manifest.entries.singleWhere(
      (entry)=>entry.dataClass=='jobs',
    );
    expect(jobs.role,TitanMobileStorageRole.authorisedProjection);
    expect(jobs.canonicalOwner,'db');
    expect(
      manifest.entries.any(
        (entry)=>entry.role==TitanMobileStorageRole.authorisedProjection&&
            entry.canonicalOwner=='mobile-1',
      ),
      isFalse,
    );
  });
}
