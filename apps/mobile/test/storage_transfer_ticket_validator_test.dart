import 'package:flutter_test/flutter_test.dart';
import 'package:titan_mobile_mvp/titan/edge/storage_fabric_topology.dart';
import 'package:titan_mobile_mvp/titan/edge/storage_transfer_ticket.dart';
import 'package:titan_mobile_mvp/titan/edge/storage_transfer_ticket_validator.dart';
import 'storage_fabric_test_support.dart';

void main(){
  const validator=TitanStorageTransferTicketValidator();

  test('bounded HTTPS customer-cloud ticket validates',(){
    final endpoint=storageTopology().endpoint('drive-archive')!;
    validator.validate(
      ticket:TitanStorageTransferTicket(
        ticketId:'t1',
        companyId:'c1',
        endpointId:endpoint.endpointId,
        provider:endpoint.provider,
        role:TitanStorageFabricRole.archive,
        operation:TitanStorageTransferOperation.read,
        dataClass:'jobs',
        objectId:'a1',
        uri:Uri.parse('https://storage.example/object'),
        headers:const {'x-ticket':'short-lived'},
        objectRef:'drive://a1',
        expectedSha256:'${'a'*64}',
        maxBytes:1000,
        dataEgress:'customer_cloud',
        expiresAt:DateTime.now().toUtc().add(
          const Duration(minutes:10),
        ),
      ),
      endpoint:endpoint,
      role:TitanStorageFabricRole.archive,
      companyId:'c1',
      dataClass:'jobs',
      objectId:'a1',
      operation:TitanStorageTransferOperation.read,
      now:DateTime.now().toUtc(),
    );
  });

  test('raw Authorization header and missing digest are rejected',(){
    final endpoint=storageTopology().endpoint('drive-archive')!;
    final bad=TitanStorageTransferTicket(
      ticketId:'t1',
      companyId:'c1',
      endpointId:endpoint.endpointId,
      provider:endpoint.provider,
      role:TitanStorageFabricRole.archive,
      operation:TitanStorageTransferOperation.read,
      dataClass:'jobs',
      objectId:'a1',
      uri:Uri.parse('https://storage.example/object'),
      headers:const {'authorization':'Bearer raw-provider-secret'},
      objectRef:'drive://a1',
      expectedSha256:'',
      maxBytes:1000,
      dataEgress:'customer_cloud',
      expiresAt:DateTime.now().toUtc().add(
        const Duration(minutes:10),
      ),
    );
    expect(
      ()=>validator.validate(
        ticket:bad,
        endpoint:endpoint,
        role:TitanStorageFabricRole.archive,
        companyId:'c1',
        dataClass:'jobs',
        objectId:'a1',
        operation:TitanStorageTransferOperation.read,
        now:DateTime.now().toUtc(),
      ),
      throwsStateError,
    );
  });
}
