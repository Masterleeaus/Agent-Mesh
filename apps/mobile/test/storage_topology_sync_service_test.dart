import 'package:flutter_test/flutter_test.dart';
import 'package:titan_mobile_mvp/titan/edge/storage_fabric_topology_repository.dart';
import 'package:titan_mobile_mvp/titan/edge/storage_topology_sync_service.dart';
import 'package:titan_mobile_mvp/titan/models/server_sync_config.dart';
import 'package:titan_mobile_mvp/titan/models/titan_http_response.dart';
import 'package:titan_mobile_mvp/titan/services/titan_auth_token_provider.dart';
import 'secure_test_harness.dart';
import 'server_sync_test_support.dart';
import 'storage_fabric_test_support.dart';

void main(){
  test('authenticated topology sync applies canonical sequence and sends known sequence',() async{
    final harness=await TitanSecureTestHarness.create();
    addTearDown(harness.dispose);
    final repo=TitanStorageFabricTopologyRepository(
      scopeKey:'c1:owner:d1:zero',
      companyId:'c1',
      store:harness.newStateStore(),
    );
    final http=FakeTitanHttpClient();
    http.getResponses.add(jsonResponse(
      200,
      storageTopology(
        sequence:3,
        revision:'r3',
        correlationId:'corr3',
      ).toJson(),
    ));
    final result=await TitanStorageTopologySyncService(
      companyId:'c1',
      actorId:'owner',
      deviceId:'d1',
      surface:'zero',
      config:TitanServerSyncConfig(
        baseUri:Uri.parse('https://core.example/'),
      ),
      authTokenProvider:const FixedTitanAuthTokenProvider('token'),
      httpClient:http,
      repository:repo,
    ).synchronize();

    expect(result.updated,isTrue);
    expect((await repo.load())?.sequence,3);
    expect(http.requests.single.uri.path,'/v1/mobile/storage/topology');
    expect(
      http.requests.single.uri.queryParameters['known_sequence'],
      '0',
    );
    expect(
      http.requests.single.headers['x-titan-company-id'],
      'c1',
    );
  });

  test('204 topology sync preserves encrypted current topology',() async{
    final harness=await TitanSecureTestHarness.create();
    addTearDown(harness.dispose);
    final repo=TitanStorageFabricTopologyRepository(
      scopeKey:'c1:owner:d1:zero',
      companyId:'c1',
      store:harness.newStateStore(),
    );
    await repo.apply(storageTopology(
      sequence:2,
      revision:'r2',
      correlationId:'corr2',
    ));
    final http=FakeTitanHttpClient();
    http.getResponses.add(const TitanHttpResponse(statusCode:204));
    final result=await TitanStorageTopologySyncService(
      companyId:'c1',
      actorId:'owner',
      deviceId:'d1',
      surface:'zero',
      config:TitanServerSyncConfig(
        baseUri:Uri.parse('https://core.example/'),
      ),
      authTokenProvider:const FixedTitanAuthTokenProvider('token'),
      httpClient:http,
      repository:repo,
    ).synchronize();
    expect(result.unchanged,isTrue);
    expect(result.topology?.sequence,2);
    expect(
      http.requests.single.uri.queryParameters['known_sequence'],
      '2',
    );
  });
}
