import 'package:flutter_test/flutter_test.dart';
import 'package:titan_mobile_mvp/titan/edge/core_storage_transfer_ticket_provider.dart';
import 'package:titan_mobile_mvp/titan/edge/storage_fabric_topology.dart';
import 'package:titan_mobile_mvp/titan/edge/storage_transfer_ticket.dart';
import 'package:titan_mobile_mvp/titan/models/server_sync_config.dart';
import 'package:titan_mobile_mvp/titan/services/titan_auth_token_provider.dart';
import 'server_sync_test_support.dart';
import 'storage_fabric_test_support.dart';

void main(){
  test('Core ticket request carries canonical storage vocabulary and no provider secret',() async{
    final http=FakeTitanHttpClient();
    http.postResponses.add(jsonResponse(200,{
      'ticket_id':'t1',
      'company_id':'c1',
      'endpoint_id':'s3-backup-b',
      'provider':'s3_compatible',
      'role':'backup',
      'operation':'write',
      'data_class':'jobs',
      'object_id':'b1',
      'url':'https://storage.example/b1',
      'headers':{'x-upload-token':'ephemeral'},
      'object_ref':'s3://bucket/b1',
      'expected_sha256':'${'a'*64}',
      'max_bytes':2000,
      'data_egress':'customer_cloud',
      'expires_at':DateTime.now().toUtc()
          .add(const Duration(minutes:10))
          .toIso8601String(),
    }));
    final provider=TitanCoreStorageTransferTicketProvider(
      companyId:'c1',
      actorId:'owner',
      deviceId:'d1',
      surface:'zero',
      config:TitanServerSyncConfig(
        baseUri:Uri.parse('https://core.example/'),
      ),
      authTokenProvider:const FixedTitanAuthTokenProvider('core-token'),
      httpClient:http,
    );
    final ticket=await provider.prepareWrite(
      endpoint:storageTopology().endpoint('s3-backup-b')!,
      role:TitanStorageFabricRole.backup,
      companyId:'c1',
      dataClass:'jobs',
      objectId:'b1',
      byteLength:100,
      sha256:'${'a'*64}',
      contentType:'application/octet-stream',
      operationId:'op1',
    );
    expect(ticket.provider,TitanStorageProviderKind.s3Compatible);
    expect(http.requests.single.jsonBody?['provider'],'s3_compatible');
    expect(http.requests.single.jsonBody?['role'],'backup');
    expect(
      http.requests.single.jsonBody?.toString(),
      isNot(contains('access_key')),
    );
    expect(
      http.requests.single.headers['authorization'],
      'Bearer core-token',
    );
  });
}
