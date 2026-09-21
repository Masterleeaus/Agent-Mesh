import '../core/titan_session.dart';
import '../models/generative_item.dart';
import '../models/titan_command.dart';
import '../generative/demo_engine.dart';
import 'offline_command_queue.dart';

/// Authority-neutral mobile boundary mirroring the canonical TypeScript
/// Surface SDK. Production transports obtain projections and receipts from
/// Titan Core; the Flutter client never grants itself execution authority.
abstract class TitanGateway {
  Future<List<TitanGenerativeItem>> converse(String message);
  Future<void> command(String capability, Map<String, dynamic> payload, {bool onlineRequired = false});
}

abstract class TitanSurfaceTransport {
  Future<Map<String, dynamic>> getProjection({
    required String companyId,
    required String surface,
  });

  Future<Map<String, dynamic>> submitCommand(Map<String, dynamic> intent);
}

class SurfaceSdkTitanGateway implements TitanGateway {
  final TitanSession session;
  final TitanSurfaceTransport transport;
  Map<String, dynamic>? _projection;

  SurfaceSdkTitanGateway(this.session, this.transport);

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
    final expiresAt = DateTime.tryParse(projection['expires_at']?.toString() ?? '');
    if (expiresAt == null || !expiresAt.isAfter(DateTime.now().toUtc())) {
      throw StateError('surface-projection-expired');
    }
    if (projection['authority_neutral'] != true ||
        projection['identity_grants_authority'] != false ||
        projection['cached_state_grants_authority'] != false) {
      throw StateError('surface-projection-authority-invalid');
    }
    _projection = Map<String, dynamic>.unmodifiable(projection);
    return _projection!;
  }

  @override
  Future<List<TitanGenerativeItem>> converse(String message) {
    throw StateError('production-conversation-transport-required');
  }

  @override
  Future<void> command(String capability, Map<String, dynamic> payload, {bool onlineRequired = false}) async {
    final projection = _projection ?? await refreshProjection();
    final capabilities = (projection['capabilities'] as List? ?? const [])
        .whereType<Map>()
        .map((e) => Map<String, dynamic>.from(e))
        .toList(growable: false);
    Map<String, dynamic>? grant;
    for (final entry in capabilities) {
      final operations = (entry['operations'] as List? ?? const []).map((e) => e.toString());
      if (entry['capability_id'] == capability && operations.contains(capability)) {
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
      'operation': capability,
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
        (receipt['receipt_id']?.toString().isEmpty ?? true)) {
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
  Future<void> command(String capability, Map<String, dynamic> payload, {bool onlineRequired = false}) async {
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
