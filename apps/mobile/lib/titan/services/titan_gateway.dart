import '../core/titan_session.dart';
import '../models/generative_item.dart';
import '../models/titan_command.dart';
import '../generative/demo_engine.dart';
import 'offline_command_queue.dart';
import 'hosted_conversation_transport.dart';
import '../core/mobile_audience_guard.dart';

/// Authority-neutral mobile boundary mirroring the canonical TypeScript
/// Surface SDK. Production transports obtain projections and receipts from
/// Titan Core; the Flutter client never grants itself execution authority.
abstract class TitanGateway {
  Future<List<TitanGenerativeItem>> converse(String message);
  Future<void> command(String capability, Map<String, dynamic> payload, {String? operation, bool onlineRequired = false});
}

abstract class TitanSurfaceTransport {
  Future<Map<String, dynamic>> getProjection({
    required String companyId,
    required String surface,
  });

  Future<Map<String, dynamic>> submitCommand(Map<String, dynamic> intent);
}

/// Hosted Workforce conversation boundary. The deployed host must derive
/// actor/company authority from its authenticated session and validate these
/// IDs as context only. No route shape is assumed by the native app.
abstract class TitanConversationTransport {
  Future<Map<String, dynamic>> send(
    Map<String, dynamic> request, {
    Duration timeout = const Duration(seconds: 30),
  });
}

class SurfaceSdkTitanGateway implements TitanGateway {
  final TitanSession session;
  final TitanSurfaceTransport transport;
  final TitanConversationTransport? conversationTransport;
  final HostedConversationTransport? hostedConversationTransport;
  final String Function()? idFactory;
  final Map<String, String> _messageRequestIds = {};
  final Map<String, String> _conversationIdsByMessage = {};
  String? _conversationId;
  String? _lastAcceptedMessage;
  Map<String, dynamic>? _projection;

  SurfaceSdkTitanGateway(this.session, this.transport,
      {this.conversationTransport, this.hostedConversationTransport, this.idFactory});

  Future<Map<String, dynamic>> refreshProjection() async {
    final projection = await transport.getProjection(
      companyId: session.companyId,
      surface: session.surface,
    );
    if (projection['company_id'] != session.companyId) {
      throw StateError('surface-projection-company-mismatch');
    }
    if (projection['surface'] != session.surface) {
      throw StateError('surface-projection-role-mismatch');
    }
    if (projection['schema_version'] != '1.0') {
      throw StateError('surface-projection-schema-mismatch');
    }
    if (projection['actor_id'] != session.actorId) {
      throw StateError('surface-projection-actor-mismatch');
    }
    const MobileAudienceGuard().validate(
      surface: session.surface, actorId: session.actorId, projection: projection);
    if ((projection['revision']?.toString().trim().isEmpty ?? true)) {
      throw StateError('surface-projection-revision-required');
    }
    final issuedAt = DateTime.tryParse(projection['issued_at']?.toString() ?? '');
    if (issuedAt == null) {
      throw StateError('surface-projection-issued-at-invalid');
    }
    final expiresAt = DateTime.tryParse(projection['expires_at']?.toString() ?? '');
    if (expiresAt == null || !expiresAt.isAfter(DateTime.now().toUtc())) {
      throw StateError('surface-projection-expired');
    }
    if (projection['authority_neutral'] != true ||
        projection['identity_grants_authority'] != false ||
        projection['cached_state_grants_authority'] != false) {
      throw StateError('surface-projection-authority-invalid');
    }
    final rawCapabilities = projection['capabilities'];
    if (rawCapabilities is! List) {
      throw StateError('surface-projection-capabilities-invalid');
    }
    final capabilityIds = <String>{};
    for (final rawCapability in rawCapabilities) {
      if (rawCapability is! Map) {
        throw StateError('surface-projection-capabilities-invalid');
      }
      final entry = Map<String, dynamic>.from(rawCapability);
      final capabilityId = entry['capability_id']?.toString().trim() ?? '';
      final operations = entry['operations'];
      if (capabilityId.isEmpty || operations is! List || operations.isEmpty) {
        throw StateError('surface-projection-capabilities-invalid');
      }
      if (!capabilityIds.add(capabilityId)) {
        throw StateError('surface-capability-id-duplicate');
      }
      for (final operation in operations) {
        if (operation is! String || operation.trim().isEmpty) {
          throw StateError('surface-projection-capabilities-invalid');
        }
      }
    }
    _projection = Map<String, dynamic>.unmodifiable(projection);
    return _projection!;
  }

  @override
  Future<List<TitanGenerativeItem>> converse(String message) async {
    if (hostedConversationTransport != null) return hostedConversationTransport!.send(message);
    final text = message.trim();
    if (text.isEmpty) throw ArgumentError.value(message, 'message', 'message-required');
    if (text.length.compareTo(20000) == 1) {
      throw ArgumentError.value(message, 'message', 'message-too-large');
    }
    final conversation = conversationTransport;
    if (conversation == null) throw StateError('production-conversation-transport-required');

    final projection = _projection ?? await refreshProjection();
    final expiresAt = DateTime.tryParse(projection['expires_at']?.toString() ?? '');
    if (expiresAt == null || !expiresAt.isAfter(DateTime.now().toUtc())) {
      _projection = null;
      throw StateError('surface-projection-expired');
    }
    final requestId = _messageRequestIds.putIfAbsent(text, _newId);
    final conversationId = _conversationIdsByMessage.putIfAbsent(text, () {
      if (_conversationId != null && _lastAcceptedMessage == text) return _newId();
      return _conversationId ?? _newId();
    });
    final request = <String, dynamic>{
      'schema_version': '1.0',
      'company_id': session.companyId,
      'surface': session.surface,
      'actor_id': session.actorId,
      'device_id': session.deviceId,
      'conversation_id': conversationId,
      'request_id': requestId,
      'correlation_id': requestId,
      'trace_id': requestId,
      'idempotency_key': requestId,
      'operation_id': requestId,
      'context_revision': projection['revision'],
      'text': text,
    };
    final response = await conversation.send(request);
    _validateConversationResponse(response,
        expectedConversationId: conversationId, expectedRequestId: requestId);
    _conversationId = conversationId;
    _lastAcceptedMessage = text;
    _messageRequestIds.remove(text);
    _conversationIdsByMessage.remove(text);
    final rawItems = response['items'];
    if (rawItems is! List || rawItems.length > 100) {
      throw const FormatException('conversation-items-invalid');
    }
    return rawItems.map((item) {
      if (item is! Map) throw const FormatException('conversation-item-invalid');
      return TitanGenerativeItem.fromJson(Map<String, dynamic>.from(item));
    }).toList(growable: false);
  }

  String _newId() => (idFactory?.call() ??
          '${session.deviceId}-${DateTime.now().toUtc().microsecondsSinceEpoch}')
      .trim();

  void _validateConversationResponse(Map<String, dynamic> response,
      {required String expectedConversationId, required String expectedRequestId}) {
    if (response['accepted'] != true ||
        response['authority_neutral'] != true ||
        response['company_id'] != session.companyId ||
        response['surface'] != session.surface ||
        response['actor_id'] != session.actorId ||
        response['conversation_id'] != expectedConversationId ||
        response['request_id'] != expectedRequestId ||
        (response['context_revision']?.toString().trim().isEmpty ?? true)) {
      throw StateError('conversation-response-context-mismatch');
    }
  }

  @override
  Future<void> command(String capability, Map<String, dynamic> payload, {String? operation, bool onlineRequired = false}) async {
    final requestedOperation = operation ?? capability;
    final projection = _projection ?? await refreshProjection();
    final capabilities = (projection['capabilities'] as List? ?? const [])
        .whereType<Map>()
        .map((e) => Map<String, dynamic>.from(e))
        .toList(growable: false);
    Map<String, dynamic>? grant;
    for (final entry in capabilities) {
      final operations = (entry['operations'] as List? ?? const []).map((e) => e.toString());
      if (entry['capability_id'] == capability && operations.contains(requestedOperation)) {
        grant = entry;
        break;
      }
    }
    if (grant == null) throw StateError('surface-capability-not-authorised');
    final expiresAt = DateTime.tryParse(projection['expires_at']?.toString() ?? '');
    if (expiresAt == null || !expiresAt.isAfter(DateTime.now().toUtc())) {
      _projection = null;
      throw StateError('surface-projection-expired');
    }

    final now = DateTime.now().toUtc();
    final commandId = '${session.deviceId}-${now.microsecondsSinceEpoch}';
    final correlationId = 'mobile-$commandId';
    final intent = <String, dynamic>{
      'schema_version': '1.0',
      'command_id': commandId,
      'company_id': session.companyId,
      'surface': session.surface,
      'actor_id': session.actorId,
      'projection_revision': projection['revision'],
      'capability_id': capability,
      'operation': requestedOperation,
      'idempotency_key': commandId,
      'correlation_id': correlationId,
      'payload': payload,
      'transport': 'titan-command-bus',
      'execution_authorised': false,
      'requires_server_acceptance': true,
      'requires_receipt': grant['requires_receipt'] ?? grant['mutation'] == true,
    };
    final receipt = await transport.submitCommand(intent);
    const validStatuses = {'accepted', 'rejected', 'completed', 'failed'};
    if (receipt['company_id'] != session.companyId ||
        receipt['command_id'] != commandId ||
        receipt['correlation_id'] != correlationId ||
        !validStatuses.contains(receipt['status']) ||
        receipt['authority_source'] != 'server' ||
        (receipt['receipt_id']?.toString().trim().isEmpty ?? true)) {
      throw StateError('surface-receipt-mismatch');
    }
  }
}

/// Development/offline compatibility gateway. It deliberately cannot execute
/// server-only mutations and is not production authority.
class LocalMvpTitanGateway implements TitanGateway {
  final TitanSession session;
  final OfflineCommandQueue queue;
  LocalMvpTitanGateway(this.session, this.queue);

  @override
  Future<List<TitanGenerativeItem>> converse(String message) async =>
      demoGenerativeResponse(message);

  @override
  Future<void> command(String capability, Map<String, dynamic> payload, {String? operation, bool onlineRequired = false}) async {
    if (onlineRequired) throw StateError('$capability requires the Titan server');
    final now = DateTime.now();
    await queue.enqueue(TitanCommand(
      id: '${session.deviceId}-${now.microsecondsSinceEpoch}',
      capability: capability,
      payload: {...session.toJson(), ...payload},
      createdAt: now,
    ));
  }
}
