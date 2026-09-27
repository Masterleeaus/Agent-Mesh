import 'package:flutter_test/flutter_test.dart';
import 'package:titan_mobile_mvp/titan/edge/storage_fabric_topology.dart';
import 'package:titan_mobile_mvp/titan/edge/storage_fabric_topology_validator.dart';

TitanStorageFabricEndpoint endpoint({
  required String id,
  required TitanStorageProviderKind provider,
  required TitanStorageAccessMode access,
  required List<TitanStorageFabricRole> roles,
  required List<String> dataClasses,
  TitanStorageEndpointState state=TitanStorageEndpointState.healthy,
  bool readable=false,
  bool writable=false,
  List<String> allowedHosts=const [],
})=>TitanStorageFabricEndpoint(
  endpointId:id,
  companyId:'c1',
  displayName:id,
  provider:provider,
  accessMode:access,
  state:state,
  roles:roles,
  dataClasses:dataClasses,
  locality:'customer_controlled',
  protection:'encrypted',
  residency:'AU',
  credentialMode:'delegated_ticket',
  allowedTransferHosts:allowedHosts,
  mobileReadable:readable,
  mobileWritable:writable,
  observedAt:DateTime.utc(2026,9,20,10),
);

TitanStorageFabricTopology topology({
  required List<TitanStorageFabricEndpoint> endpoints,
  required List<TitanStorageDataClassRoute> routes,
})=>TitanStorageFabricTopology(
  companyId:'c1',
  sequence:1,
  revision:'r1',
  correlationId:'corr1',
  issuedAt:DateTime.utc(2026,9,20,10),
  endpoints:endpoints,
  routes:routes,
);

void main(){
  const validator=TitanStorageFabricTopologyValidator();

  test('transactional route has exactly one database-like canonical owner',(){
    validator.validate(
      topology:topology(
        endpoints:[
          endpoint(
            id:'db',
            provider:TitanStorageProviderKind.postgres,
            access:TitanStorageAccessMode.statusOnly,
            roles:const [TitanStorageFabricRole.canonical],
            dataClasses:const ['jobs'],
          ),
          endpoint(
            id:'backup',
            provider:TitanStorageProviderKind.s3,
            access:TitanStorageAccessMode.delegatedHttps,
            roles:const [TitanStorageFabricRole.backup],
            dataClasses:const ['jobs'],
            writable:true,
            readable:true,
            allowedHosts:const ['example-storage.test'],
          ),
        ],
        routes:const [
          TitanStorageDataClassRoute(
            dataClass:'jobs',
            kind:TitanStorageDataClassKind.transactional,
            canonicalEndpointId:'db',
            backupEndpointIds:['backup'],
            recoveryOrder:['backup'],
          ),
        ],
      ),
      companyId:'c1',
      now:DateTime.utc(2026,9,20,10),
    );
  });

  test('Drive cannot be transactional canonical database',(){
    expect(
      ()=>validator.validate(
        topology:topology(
          endpoints:[
            endpoint(
              id:'drive',
              provider:TitanStorageProviderKind.googleDrive,
              access:TitanStorageAccessMode.statusOnly,
              roles:const [TitanStorageFabricRole.canonical],
              dataClasses:const ['jobs'],
            ),
          ],
          routes:const [
            TitanStorageDataClassRoute(
              dataClass:'jobs',
              kind:TitanStorageDataClassKind.transactional,
              canonicalEndpointId:'drive',
            ),
          ],
        ),
        companyId:'c1',
        now:DateTime.utc(2026,9,20,10),
      ),
      throwsStateError,
    );
  });

  test('S3 can own canonical object data while mobile still cannot write it directly',(){
    validator.validate(
      topology:topology(
        endpoints:[
          endpoint(
            id:'evidence-object',
            provider:TitanStorageProviderKind.s3,
            access:TitanStorageAccessMode.statusOnly,
            roles:const [TitanStorageFabricRole.canonical],
            dataClasses:const ['field_evidence'],
          ),
        ],
        routes:const [
          TitanStorageDataClassRoute(
            dataClass:'field_evidence',
            kind:TitanStorageDataClassKind.object,
            canonicalEndpointId:'evidence-object',
          ),
        ],
      ),
      companyId:'c1',
      now:DateTime.utc(2026,9,20,10),
    );
  });

  test('two canonical advertisers for one data class fail closed',(){
    expect(
      ()=>validator.validate(
        topology:topology(
          endpoints:[
            endpoint(
              id:'db1',
              provider:TitanStorageProviderKind.postgres,
              access:TitanStorageAccessMode.statusOnly,
              roles:const [TitanStorageFabricRole.canonical],
              dataClasses:const ['jobs'],
            ),
            endpoint(
              id:'db2',
              provider:TitanStorageProviderKind.mysql,
              access:TitanStorageAccessMode.statusOnly,
              roles:const [TitanStorageFabricRole.canonical],
              dataClasses:const ['jobs'],
            ),
          ],
          routes:const [
            TitanStorageDataClassRoute(
              dataClass:'jobs',
              canonicalEndpointId:'db1',
            ),
          ],
        ),
        companyId:'c1',
        now:DateTime.utc(2026,9,20,10),
      ),
      throwsStateError,
    );
  });

  test('delegated endpoint needs host allowlist and cannot expose raw credentials',(){
    expect(
      ()=>validator.validate(
        topology:topology(
          endpoints:[
            endpoint(
              id:'db',
              provider:TitanStorageProviderKind.postgres,
              access:TitanStorageAccessMode.statusOnly,
              roles:const [TitanStorageFabricRole.canonical],
              dataClasses:const ['jobs'],
            ),
            endpoint(
              id:'archive',
              provider:TitanStorageProviderKind.googleDrive,
              access:TitanStorageAccessMode.delegatedHttps,
              roles:const [TitanStorageFabricRole.archive],
              dataClasses:const ['jobs'],
              writable:true,
              readable:true,
            ),
          ],
          routes:const [
            TitanStorageDataClassRoute(
              dataClass:'jobs',
              canonicalEndpointId:'db',
              archiveEndpointIds:['archive'],
            ),
          ],
        ),
        companyId:'c1',
        now:DateTime.utc(2026,9,20,10),
      ),
      throwsStateError,
    );
  });
}
