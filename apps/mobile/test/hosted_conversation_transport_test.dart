import 'dart:convert';
import 'dart:io';

import 'package:flutter_test/flutter_test.dart';
import 'package:titan_zero_mobile/titan/core/titan_session.dart';
import 'package:titan_zero_mobile/titan/services/hosted_conversation_transport.dart';

void main() {
  test(
      'hosted retry preserves idempotency identity after a transient HTTP failure',
      () async {
    final server = await HttpServer.bind(InternetAddress.loopbackIPv4, 0);
    final requests = <Map<String, dynamic>>[];
    final serving = server.forEach((request) async {
      final body = jsonDecode(await utf8.decoder.bind(request).join())
          as Map<String, dynamic>;
      requests.add(body);
      if (requests.length == 1) {
        request.response.statusCode = HttpStatus.serviceUnavailable;
        request.response.write('{"error":"temporarily-unavailable"}');
      } else {
        request.response.headers.contentType = ContentType.json;
        request.response.write(jsonEncode({
          'accepted': true,
          'schema_version': 'titan.workforce.conversation.v1',
          'company_id': body['company_id'],
          'actor_id': body['actor_id'],
          'device_id': body['device_id'],
          'surface': body['surface'],
          'session_id': body['session_id'],
          'context_revision': body['context_revision'],
          'conversation_id': body['conversation_id'],
          'request_id': body['request_id'],
          'events': [],
        }));
      }
      await request.response.close();
    });

    var id = 0;
    final transport = HostedConversationTransport(
      endpoint: Uri.parse(
          'http://${server.address.address}:${server.port}/v1/workforce/conversations'),
      session: TitanSession(
          companyId: 'company-1', actorId: 'actor-1', deviceId: 'device-1'),
      sessionId: 'session-1',
      contextRevision: 'revision-7',
      idFactory: () => 'stable-${++id}',
    );

    try {
      await expectLater(
          transport.send('Inspect my next job'), throwsA(isA<HttpException>()));
      await expectLater(
          transport.send('A different message'), throwsA(isA<StateError>()));
      expect(requests, hasLength(1));

      await transport.send('Inspect my next job');
      expect(requests, hasLength(2));
      for (final key in [
        'conversation_id',
        'interaction_id',
        'client_message_id',
        'request_id',
        'operation_id',
        'correlation_id',
        'trace_id',
        'idempotency_key',
      ]) {
        expect(requests[1][key], requests[0][key],
            reason: '$key must be stable across a retry');
      }

      await transport.send('Inspect tomorrow instead');
      expect(requests, hasLength(3));
      expect(requests[2]['client_message_id'],
          isNot(requests[1]['client_message_id']));
      expect(requests[2]['idempotency_key'],
          isNot(requests[1]['idempotency_key']));
      expect(requests[2]['conversation_id'], requests[1]['conversation_id']);
    } finally {
      transport.close(force: true);
      await server.close(force: true);
      await serving;
    }
  });
}
