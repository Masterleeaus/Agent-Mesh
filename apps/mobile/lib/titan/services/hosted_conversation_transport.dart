import 'dart:async';
import 'dart:convert';
import 'dart:io';

import '../core/titan_session.dart';
import '../models/generative_item.dart';

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

  HostedConversationTransport({
    required this.endpoint,
    required this.session,
    required this.sessionId,
    required this.contextRevision,
    this.bearerToken,
    HttpClient? client,
  }) : _client = client ?? HttpClient();

  Future<List<TitanGenerativeItem>> send(String text, {Duration timeout = const Duration(seconds: 30)}) async {
    final response = await _request(action: _continuationToken == null ? 'start' : 'continue', text: text, timeout: timeout);
    return _items(response);
  }

  Future<List<TitanGenerativeItem>> resume(String text, {Duration timeout = const Duration(seconds: 30)}) async {
    if (_continuationToken == null) throw StateError('conversation-resume-token-required');
    final response = await _request(action: 'resume', text: text, timeout: timeout);
    return _items(response);
  }

  Future<void> cancel({Duration timeout = const Duration(seconds: 30)}) async {
    if (_continuationToken == null) return;
    await _request(action: 'cancel', timeout: timeout);
    _continuationToken = null;
  }

  void reconnect() {
    // Retain conversation, continuation and last event identity. The next
    // request sends Last-Event-ID so the host can replay only missing events.
  }

  Future<Map<String, dynamic>> _request({
    required String action,
    String? text,
    required Duration timeout,
  }) async {
    if (timeout <= Duration.zero) throw ArgumentError.value(timeout, 'timeout');
    final now = DateTime.now().toUtc().microsecondsSinceEpoch;
    final conversationId = _conversationId ?? 'mobile-${session.deviceId}-$now';
    final requestId = 'req-${session.deviceId}-$now';
    final body = <String, dynamic>{
      'action': action,
      ...session.toJson(),
      'session_id': sessionId,
      'context_revision': contextRevision,
      'conversation_id': conversationId,
      'interaction_id': 'interaction-$now',
      'client_message_id': 'message-$now',
      'request_id': requestId,
      'operation_id': 'operation-$now',
      'correlation_id': 'mobile-correlation-$now',
      'trace_id': 'mobile-trace-$now',
      'idempotency_key': 'mobile-idempotency-$now',
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
