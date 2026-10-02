import 'package:flutter_test/flutter_test.dart';
import 'package:titan_zero_mobile/titan/core/titan_session.dart';
import 'package:titan_zero_mobile/titan/services/titan_gateway.dart';

class _SurfaceTransport implements TitanSurfaceTransport {
  final String expiry;
  _SurfaceTransport({this.expiry = '2099-10-01T00:00:00Z'});
  @override
  Future<Map<String, dynamic>> getProjection({required String companyId, required String surface}) async => {
    'company_id': companyId,
    'surface': surface,
    'schema_version': '1.0',
    'actor_id': 'actor-1',
    'worker_id': 'actor-1',
    'assignment_revision': 'assignment-1',
    'revision': 'rev-12',
    'issued_at': '2026-10-01T00:00:00Z',
    'expires_at': expiry,
    'authority_neutral': true,
    'identity_grants_authority': false,
    'cached_state_grants_authority': false,
    'capabilities': <Map<String, dynamic>>[],
  };

  @override
  Future<Map<String, dynamic>> submitCommand(Map<String, dynamic> intent) async => {};
}

class _ConversationTransport implements TitanConversationTransport {
  final responses = <Map<String, dynamic>>[];
  final requests = <Map<String, dynamic>>[];

  @override
  Future<Map<String, dynamic>> send(Map<String, dynamic> request, {Duration timeout = const Duration(seconds: 30)}) async {
    requests.add(Map<String, dynamic>.from(request));
    if (responses.isEmpty) throw StateError('offline');
    return responses.removeAt(0);
  }
}

void main() {
  final session = TitanSession(companyId: 'company-1', actorId: 'actor-1', deviceId: 'device-1', surface: 'go');
  Map<String, dynamic> accepted(Map<String, dynamic> request) => {
    'accepted': true,
    'authority_neutral': true,
    'company_id': request['company_id'],
    'surface': request['surface'],
    'actor_id': request['actor_id'],
    'conversation_id': request['conversation_id'],
    'request_id': request['request_id'],
    'context_revision': 'rev-13',
    'items': [{'type': 'notice', 'title': 'Connected'}],
  };

  test('production conversation carries canonical scope and reuses IDs on retry', () async {
    final transport = _ConversationTransport();
    var id = 0;
    final gateway = SurfaceSdkTitanGateway(session, _SurfaceTransport(),
      conversationTransport: transport, idFactory: () => 'id-${++id}');

    await expectLater(gateway.converse('Check my next job'), throwsStateError);
    transport.responses.add(accepted(transport.requests.single));
    final response = await gateway.converse('Check my next job');

    expect(response.single.title, 'Connected');
    expect(transport.requests, hasLength(2));
    expect(transport.requests[0], containsPair('company_id', 'company-1'));
    expect(transport.requests[0], containsPair('surface', 'go'));
    expect(transport.requests[0], containsPair('actor_id', 'actor-1'));
    expect(transport.requests[0], containsPair('device_id', 'device-1'));
    for (final key in ['request_id', 'operation_id', 'correlation_id', 'trace_id', 'idempotency_key']) {
      expect(transport.requests[0][key], transport.requests[1][key]);
    }
    expect(transport.requests[0]['conversation_id'], transport.requests[1]['conversation_id']);
    expect(transport.requests[0]['context_revision'], 'rev-12');

    transport.responses.add(accepted({
      ...transport.requests[1],
      'conversation_id': 'id-4',
      'request_id': 'id-3',
    }));
    await gateway.converse('Check my next job');
    expect(transport.requests[2]['conversation_id'], 'id-4');
    expect(transport.requests[2]['request_id'], 'id-3');
    expect(transport.requests[2]['request_id'], isNot(transport.requests[0]['request_id']));
  });

  test('context mismatch and oversized input fail closed', () async {
    final transport = _ConversationTransport();
    final gateway = SurfaceSdkTitanGateway(session, _SurfaceTransport(),
      conversationTransport: transport, idFactory: () => 'stable-id');
    await expectLater(gateway.converse('x' * 20001), throwsArgumentError);
    transport.responses.add({'accepted': true, 'authority_neutral': true, 'company_id': 'other-company'});
    await expectLater(gateway.converse('hello'), throwsStateError);
  });

  test('missing production transport fails closed without demo response', () async {
    final gateway = SurfaceSdkTitanGateway(session, _SurfaceTransport());
    await expectLater(gateway.converse('hello'), throwsStateError);
  });

  test('expired projection blocks transport send', () async {
    final surface = _SurfaceTransport(expiry: '2000-01-01T00:00:00Z');
    final transport = _ConversationTransport();
    final gateway = SurfaceSdkTitanGateway(session, surface,
      conversationTransport: transport, idFactory: () => 'stable-id');
    await expectLater(gateway.converse('hello'), throwsStateError);
    expect(transport.requests, isEmpty);
  });
}
