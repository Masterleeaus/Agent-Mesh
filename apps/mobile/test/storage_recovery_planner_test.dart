import 'package:flutter_test/flutter_test.dart';
import 'package:titan_mobile_mvp/titan/edge/storage_fabric_topology.dart';
import 'package:titan_mobile_mvp/titan/edge/storage_recovery_planner.dart';

void main(){
  test('degraded canonical produces recovery plan with zero mobile promotion authority',(){
    final topology=TitanStorageFabricTopology(
      companyId:'c1',
      sequence:1,
      revision:'r1',
      correlationId:'c1',
      issuedAt:DateTime.utc(2026,9,20),
      endpoints:const [
        TitanStorageFabricEndpoint(
          endpointId:'db',
          companyId:'c1',
          displayName:'Office Postgres',
          provider:TitanStorageProviderKind.postgres,
          accessMode:TitanStorageAccessMode.statusOnly,
          state:TitanStorageEndpointState.degraded,
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
          endpointId:'backup',
          companyId:'c1',
          displayName:'Customer S3',
          provider:TitanStorageProviderKind.s3,
          accessMode:TitanStorageAccessMode.delegatedHttps,
          state:TitanStorageEndpointState.healthy,
          roles:[TitanStorageFabricRole.backup],
          dataClasses:['jobs'],
          locality:'customer_cloud',
          protection:'encrypted',
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
          dataClass:'jobs',
          canonicalEndpointId:'db',
          backupEndpointIds:['backup'],
          recoveryOrder:['backup'],
        ),
      ],
    );
    final plan=const TitanStorageRecoveryPlanner().plan(
      topology:topology,
      dataClass:'jobs',
    );
    expect(plan.degraded,isTrue);
    expect(plan.steps.single.mobileMayExecute,isTrue);
    expect(plan.steps.single.canonicalPromotionAllowed,isFalse);
    expect(
      plan.steps.single.action,
      'stage_backup_for_core_governed_restore',
    );
  });
}
