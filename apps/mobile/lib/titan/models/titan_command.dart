import 'dart:convert';

import '../core/mobile_context_scope.dart';

class TitanCommand {
  final String id;
  final String capability;
  final Map<String, dynamic> payload;
  final DateTime createdAt;
  final bool requiresOnline;
  final MobileScopeKey? explicitScope;
  final int queueSequence;
  final int mutationRevision;
  final int basedOnRevision;
  final int replayAttempts;
  final String? operationId;
  final String? requestId;
  final String? correlationId;
  final String? traceId;
  final String? idempotencyKey;
  final List<String> evidenceRefs;

  TitanCommand({
    required this.id,
    required this.capability,
    required this.payload,
    required this.createdAt,
    this.requiresOnline = false,
    this.explicitScope,
    this.queueSequence = 0,
    this.mutationRevision = 0,
    this.basedOnRevision = 0,
    this.replayAttempts = 0,
    this.operationId,
    this.requestId,
    this.correlationId,
    this.traceId,
    this.idempotencyKey,
    this.evidenceRefs = const <String>[],
  });

  MobileScopeKey get scope {
    final candidate = explicitScope;
    if (candidate != null) return candidate;
    String value(String key, {String fallback = ''}) =>
        payload[key]?.toString().trim() ?? fallback;
    return MobileScopeKey(
      companyId: value('company_id'),
      actorId: value('actor_id'),
      deviceId: value('device_id'),
      surface: value('surface', fallback: 'zero'),
      contextRevision: value('context_revision', fallback: 'legacy'),
    );
  }

  String get conflictKey =>
      '${scope.companyId}:${scope.surface}:${payload['target_id'] ?? capability}';

  String get effectiveOperationId => operationId ?? id;
  String get effectiveRequestId => requestId ?? id;
  String get effectiveCorrelationId => correlationId ?? id;
  String get effectiveTraceId => traceId ?? id;

  Map<String, dynamic> toJson() => {
    'id': id,
    'capability': capability,
    'payload': payload,
    'created_at': createdAt.toIso8601String(),
    'requires_online': requiresOnline,
    'scope': {
      'company_id': scope.companyId,
      'actor_id': scope.actorId,
      'device_id': scope.deviceId,
      'surface': scope.surface,
      'context_revision': scope.contextRevision,
    },
    'queue_sequence': queueSequence,
    'mutation_revision': mutationRevision,
    'based_on_revision': basedOnRevision,
    'replay_attempts': replayAttempts,
    'operation_id': operationId,
    'request_id': requestId,
    'correlation_id': correlationId,
    'trace_id': traceId,
    'idempotency_key': idempotencyKey ?? id,
    'evidence_refs': evidenceRefs,
  };

  factory TitanCommand.fromJson(Map<String, dynamic> j) {
    final rawScope = j['scope'];
    MobileScopeKey? scope;
    if (rawScope is Map) {
      final s = Map<String, dynamic>.from(rawScope);
      scope = MobileScopeKey(
        companyId: s['company_id']?.toString() ?? '',
        actorId: s['actor_id']?.toString() ?? '',
        deviceId: s['device_id']?.toString() ?? '',
        surface: s['surface']?.toString() ?? 'zero',
        contextRevision: s['context_revision']?.toString() ?? 'legacy',
      );
    }
    return TitanCommand(
      id: j['id']?.toString() ?? '',
      capability: j['capability']?.toString() ?? '',
      payload: Map<String, dynamic>.from(j['payload'] ?? const {}),
      createdAt: DateTime.parse(j['created_at'].toString()),
      requiresOnline: j['requires_online'] == true,
      explicitScope: scope,
      queueSequence: (j['queue_sequence'] as num?)?.toInt() ?? 0,
      mutationRevision: (j['mutation_revision'] as num?)?.toInt() ?? 0,
      basedOnRevision: (j['based_on_revision'] as num?)?.toInt() ?? 0,
      replayAttempts: (j['replay_attempts'] as num?)?.toInt() ?? 0,
      operationId: j['operation_id']?.toString(),
      requestId: j['request_id']?.toString(),
      correlationId: j['correlation_id']?.toString(),
      traceId: j['trace_id']?.toString(),
      idempotencyKey: j['idempotency_key']?.toString(),
      evidenceRefs: (j['evidence_refs'] as List? ?? const [])
          .map((e) => e.toString()).toList(growable: false),
    );
  }

  TitanCommand recordReplayAttempt(DateTime _) => TitanCommand(
    id: id,
    capability: capability,
    payload: payload,
    createdAt: createdAt,
    requiresOnline: requiresOnline,
    explicitScope: explicitScope ?? scope,
    queueSequence: queueSequence,
    mutationRevision: mutationRevision,
    basedOnRevision: basedOnRevision,
    replayAttempts: replayAttempts + 1,
    operationId: operationId,
    requestId: requestId,
    correlationId: correlationId,
    traceId: traceId,
    idempotencyKey: idempotencyKey ?? id,
    evidenceRefs: evidenceRefs,
  );

  String encode() => jsonEncode(toJson());
}
