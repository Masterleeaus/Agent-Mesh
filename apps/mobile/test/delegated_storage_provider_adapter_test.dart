import 'package:cryptography/cryptography.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:titan_mobile_mvp/titan/edge/delegated_storage_provider_adapter.dart';
import 'package:titan_mobile_mvp/titan/edge/storage_fabric_topology.dart';
import 'package:titan_mobile_mvp/titan/edge/storage_provider_adapter.dart';
import 'package:titan_mobile_mvp/titan/edge/storage_transfer_ticket.dart';
import 'package:titan_mobile_mvp/titan/models/titan_http_response.dart';
import 'storage_fabric_test_support.dart';

Future<String> sha(List<int> bytes) async{
  final digest=await Sha256().hash(bytes);
  return digest.bytes
      .map((b)=>b.toRadixString(16).padLeft(2,'0'))
      .join();
}

TitanStorageFabricEndpoint endpoint()=>TitanStorageFabricEndpoint(
  endpointId:'backup-s3',
  companyId:'c1',
  displayName:'Customer S3',
  provider:TitanStorageProviderKind.s3,
  accessMode:TitanStorageAccessMode.delegatedHttps,
  state:TitanStorageEndpointState.healthy,
  roles:const [
    TitanStorageFabricRole.backup,
    TitanStorageFabricRole.archive,
  ],
  dataClasses:const ['jobs_backup'],
  locality:'customer_cloud',
  protection:'customer_key',
  residency:'AU',
  credentialMode:'delegated_ticket',
  allowedTransferHosts:const ['customer-storage.test'],
  mobileReadable:true,
  mobileWritable:true,
  observedAt:DateTime.utc(2026,9,20),
);

void main(){
  test('delegated HTTPS write uses host-bound ticket and verifies digest',() async{
    final bytes=[1,2,3,4];
    final http=FakeStorageHttpClient(
      getResponse:const TitanHttpResponse(statusCode:500),
      putResponse:const TitanHttpResponse(statusCode:200),
    );
    final tickets=FakeStorageTicketProvider(({
      required endpoint,
      required role,
      required operation,
      required companyId,
      required dataClass,
      required objectId,
      required byteLength,
      required sha256,
      required contentType,
      required operationId,
    })=>TitanStorageTransferTicket(
      ticketId:'t1',
      companyId:companyId,
      endpointId:endpoint.endpointId,
      provider:endpoint.provider,
      role:role,
      operation:operation,
      dataClass:dataClass,
      objectId:objectId,
      uri:Uri.parse('https://bucket.customer-storage.test/object'),
      headers:const {'x-upload-token':'opaque-session'},
      objectRef:'s3://bucket/object',
      expectedSha256:sha256,
      maxBytes:1000,
      dataEgress:'customer_cloud',
      expiresAt:DateTime.now().toUtc().add(const Duration(minutes:10)),
    ));
    final adapter=TitanDelegatedStorageProviderAdapter(
      provider:TitanStorageProviderKind.s3,
      tickets:tickets,
      httpClient:http,
    );
    final receipt=await adapter.write(
      endpoint:endpoint(),
      role:TitanStorageFabricRole.backup,
      object:TitanStorageObject(
        companyId:'c1',
        dataClass:'jobs_backup',
        objectId:'backup-1',
        contentType:'application/octet-stream',
        bytes:bytes,
      ),
      operationId:'op1',
    );
    expect(receipt.sha256,await sha(bytes));
    expect(receipt.authorityEffect,'none');
    expect(http.puts.single.host,'bucket.customer-storage.test');
  });

  test('ticket host outside canonical endpoint allowlist fails before transfer',() async{
    final http=FakeStorageHttpClient(
      getResponse:const TitanHttpResponse(statusCode:500),
      putResponse:const TitanHttpResponse(statusCode:200),
    );
    final tickets=FakeStorageTicketProvider(({
      required endpoint,
      required role,
      required operation,
      required companyId,
      required dataClass,
      required objectId,
      required byteLength,
      required sha256,
      required contentType,
      required operationId,
    })=>TitanStorageTransferTicket(
      ticketId:'bad',
      companyId:companyId,
      endpointId:endpoint.endpointId,
      provider:endpoint.provider,
      role:role,
      operation:operation,
      dataClass:dataClass,
      objectId:objectId,
      uri:Uri.parse('https://evil.example/object'),
      headers:const {},
      objectRef:'bad',
      expectedSha256:sha256,
      maxBytes:1000,
      dataEgress:'customer_cloud',
      expiresAt:DateTime.now().toUtc().add(const Duration(minutes:10)),
    ));
    final adapter=TitanDelegatedStorageProviderAdapter(
      provider:TitanStorageProviderKind.s3,
      tickets:tickets,
      httpClient:http,
    );
    await expectLater(
      adapter.write(
        endpoint:endpoint(),
        role:TitanStorageFabricRole.backup,
        object:const TitanStorageObject(
          companyId:'c1',
          dataClass:'jobs_backup',
          objectId:'b1',
          contentType:'application/octet-stream',
          bytes:[1],
        ),
        operationId:'op',
      ),
      throwsStateError,
    );
    expect(http.puts,isEmpty);
  });

  test('delegated adapter refuses direct canonical/replica execution',() async{
    final http=FakeStorageHttpClient(
      getResponse:const TitanHttpResponse(statusCode:500),
      putResponse:const TitanHttpResponse(statusCode:200),
    );
    final adapter=TitanDelegatedStorageProviderAdapter(
      provider:TitanStorageProviderKind.s3,
      tickets:FakeStorageTicketProvider(({
        required endpoint,
        required role,
        required operation,
        required companyId,
        required dataClass,
        required objectId,
        required byteLength,
        required sha256,
        required contentType,
        required operationId,
      })=>throw StateError('ticket must not be requested')),
      httpClient:http,
      roles:const {
        TitanStorageFabricRole.canonical,
        TitanStorageFabricRole.backup,
      },
    );
    final bad=TitanStorageFabricEndpoint(
      endpointId:'canonical',
      companyId:'c1',
      displayName:'Canonical',
      provider:TitanStorageProviderKind.s3,
      accessMode:TitanStorageAccessMode.delegatedHttps,
      state:TitanStorageEndpointState.healthy,
      roles:const [TitanStorageFabricRole.canonical],
      dataClasses:const ['objects'],
      locality:'cloud',
      protection:'encrypted',
      residency:'AU',
      credentialMode:'delegated_ticket',
      allowedTransferHosts:const ['customer-storage.test'],
      mobileReadable:true,
      mobileWritable:true,
      observedAt:DateTime.utc(2026,9,20),
    );
    await expectLater(
      adapter.write(
        endpoint:bad,
        role:TitanStorageFabricRole.canonical,
        object:const TitanStorageObject(
          companyId:'c1',
          dataClass:'objects',
          objectId:'o1',
          contentType:'application/octet-stream',
          bytes:[1],
        ),
        operationId:'op',
      ),
      throwsStateError,
    );
  });
}
