import 'dart:async';
import 'dart:convert';
import 'dart:io';

import '../core/titan_session.dart';
import '../models/generative_item.dart';

class _ConversationRequestIdentity {
  final String conversationId;
  final String interactionId;
  final String clientMessageId;
  final String requestId;
  final String operationId;
  final String correlationId;
  final String traceId;
  final String idempotencyKey;

  const _ConversationRequestIdentity({
    required this.conversationId,
    required this.interactionId,
    required this.clientMessageId,
    required this.requestId,
    required this.operationId,
    required this.correlationId,
    required this.traceId,
    required this.idempotencyKey,
  });
}

/// Host-owned Workforce conversation lifecycle. It never falls back to the
/// local demo gateway and treats the server's context revision as authoritative.
class HostedConversationTransport {
  final Uri endpoint;
  final TitanSession session;
  final String sessionId;
  final String contextRevision;
  final String? bearerToken;
  final HttpClient _client;
  String? _conversationId;
  String? _continuationToken;
  String? _lastEventId;
  _ConversationRequestIdentity? _pendingTurn;
  _ConversationRequestIdentity? _pendingCancel;
  final String Function()? _idFactory;
  static int _sequence = 0;

  HostedConversationTransport({
    required this.endpoint,
    required this.session,
    required this.sessionId,
    required this.contextRevision,
    this.bearerToken,
    HttpClient? client,
    String Function()? idFactory,
  }) : _client = client ?? HttpClient(), _idFactory = idFactory;

  Future<List<TitanGenerativeItem>> send(String text, {Duration timeout = const Duration(seconds: 30)}) async {
    final action = _continuationToken == null ? 'start' : 'continue';
    final identity = _turnIdentity(action, text);
    final response = await _request(action: action, text: text, identity: identity, timeout: timeout);
    _pendingTurn = null;
    return _items(response);
  }

  Future<List<TitanGenerativeItem>> resume(String text, {Duration timeout = const Duration(seconds: 30)}) async {
    if (_continuationToken == null) throw StateError('conversation-resume-token-required');
    final identity = _turnIdentity('resume', text);
    final response = await _request(action: 'resume', text: text, identity: identity, timeout: timeout);
    _pendingTurn = null;
    return _items(response);
  }

  Future<void> cancel({Duration timeout = const Duration(seconds: 30)}) async {
    if (_continuationToken == null) return;
    final identity = _pendingCancel ?? _newIdentity();
    _pendingCancel = identity;
    await _request(action: 'cancel', identity: identity, timeout: timeout);
    _pendingCancel = null;
    _continuationToken = null;
  }

  void close({bool force = false}) => _client.close(force: force);

  String _newId(String kind) {
    final supplied = _idFactory?.call();
    if (supplied != null && supplied.isNotEmpty) return supplied;
    final sequence = ++_sequence;
    final now = DateTime.now().toUtc().microsecondsSinceEpoch;
    return 'mobile-${session.deviceId}-$kind-$now-$sequence';
  }

  _ConversationRequestIdentity _newIdentity() {
    return _ConversationRequestIdentity(
      conversationId: _conversationId ?? _newId('conversation'),
      interactionId: _newId('interaction'),
      clientMessageId: _newId('message'),
      requestId: _newId('request'),
      operationId: _newId('operation'),
      correlationId: _newId('correlation'),
      traceId: _newId('trace'),
      idempotencyKey: _newId('idempotency'),
    );
  }

  _ConversationRequestIdentity _turnIdentity(String action, String text) {
    final pending = _pendingTurn;
    if (pending != null) {
      if (_pendingTurnAction != action || _pendingTurnText != text) {
        throw StateError('conversation-pending-retry-required');
      }
      return pending;
    }
    _pendingTurnAction = action;
    _pendingTurnText = text;
    return _pendingTurn = _newIdentity();
  }

  String? _pendingTurnAction;
  String? _pendingTurnText;

  void reconnect() {
    // Retain conversation, continuation and last event identity. The next
    // request sends Last-Event-ID so the host can replay only missing events.
  }

  Future<Map<String, dynamic>> _request({
    required String action,
    String? text,
    required _ConversationRequestIdentity identity,
    required Duration timeout,
  }) async {
    if (timeout <= Duration.zero) throw ArgumentError.value(timeout, 'timeout');
    final conversationId = identity.conversationId;
    final requestId = identity.requestId;
    final body = <String, dynamic>{
      'action': action,
      ...session.toJson(),
      'session_id': sessionId,
      'context_revision': contextRevision,
      'conversation_id': conversationId,
      'interaction_id': identity.interactionId,
      'client_message_id': identity.clientMessageId,
      'request_id': requestId,
      'operation_id': identity.operationId,
      'correlation_id': identity.correlationId,
      'trace_id': identity.traceId,
      'idempotency_key': identity.idempotencyKey,
      if (text != null) 'text': text,
      if (_continuationToken != null) 'continuation_token': _continuationToken,
    };
    final request = await _client.postUrl(endpoint).timeout(timeout);
    request.headers.contentType = ContentType.json;
    request.headers.set(HttpHeaders.acceptHeader, ContentType.json.mimeType);
    if (_lastEventId != null) request.headers.set('Last-Event-ID', _lastEventId!);
    if (bearerToken != null && bearerToken!.isNotEmpty) {
      request.headers.set(HttpHeaders.authorizationHeader, 'Bearer $bearerToken');
    }
    request.write(jsonEncode(body));
    final response = await request.close().timeout(timeout);
    final decodedBody = await utf8.decoder.bind(response).join().timeout(timeout);
    if (response.statusCode == 401 || response.statusCode == 403) {
      throw StateError('conversation-authentication-required');
    }
    if (response.statusCode != 200 && response.statusCode != 202) {
      throw HttpException('conversation-host-${response.statusCode}', uri: endpoint);
    }
    final decoded = jsonDecode(decodedBody);
    if (decoded is! Map) throw const FormatException('conversation-response-object-required');
    final value = Map<String, dynamic>.from(decoded);
    if (value['company_id'] != session.companyId ||
        value['actor_id'] != session.actorId ||
        value['device_id'] != session.deviceId ||
        value['surface'] != session.surface ||
        value['conversation_id'] != conversationId ||
        value['context_revision'] != contextRevision ||
        value['request_id'] != requestId ||
        value['schema_version'] != 'titan.workforce.conversation.v1') {
      throw StateError('conversation-response-identity-mismatch');
    }
    _conversationId = conversationId;
    _continuationToken = value['continuation_token']?.toString();
    if (action == 'start' || action == 'continue' || action == 'resume') {
      _pendingTurnAction = null;
      _pendingTurnText = null;
    }
    final rawEvents = (value['events'] as List?) ?? const [];
    for (final raw in rawEvents) {
      if (raw is Map && raw['id'] != null) _lastEventId = raw['id'].toString();
    }
    return value;
  }

  List<TitanGenerativeItem> _items(Map<String, dynamic> response) {
    final rawItems = response['items'];
    if (rawItems is List) {
      return rawItems.whereType<Map>().map((item) => TitanGenerativeItem.fromJson(Map<String, dynamic>.from(item))).toList(growable: false);
    }
    return ((response['events'] as List?) ?? const []).whereType<Map>().map((event) {
      final map = Map<String, dynamic>.from(event);
      final text = map['delta'] ?? map['content'] ?? map['state'] ?? map['kind'] ?? 'Workforce event';
      return TitanGenerativeItem(type: TitanGenerativeType.notice, title: text.toString(), context: map);
    }).toList(growable: false);
  }
}
