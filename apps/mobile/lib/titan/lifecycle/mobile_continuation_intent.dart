import '../core_bridge/interaction_context_bridge.dart';

enum TitanContinuationSource { push, deepLink, backgroundRefresh, voice }

class TitanMobileContinuationIntent {
  final String companyId;
  final String surface;
  final String conversationId;
  final String operationId;
  final String requestId;
  final String correlationId;
  final String capability;
  final TitanContinuationSource source;
  final bool mutating;
  final DateTime issuedAt;
  final DateTime expiresAt;
  final Map<String,dynamic> payload;

  const TitanMobileContinuationIntent({
    required this.companyId,
    required this.surface,
    required this.conversationId,
    required this.operationId,
    required this.requestId,
    required this.correlationId,
    required this.capability,
    required this.source,
    required this.mutating,
    required this.issuedAt,
    required this.expiresAt,
    this.payload=const {},
  });

  bool usableAt(DateTime now)=>companyId.trim().isNotEmpty&&
      conversationId.trim().isNotEmpty&&
      operationId.trim().isNotEmpty&&requestId.trim().isNotEmpty&&
      correlationId.trim().isNotEmpty&&capability.trim().isNotEmpty&&
      expiresAt.isAfter(now)&&!issuedAt.isAfter(now.add(const Duration(minutes:5)));

  String get canonicalSurface=>titanCanonicalSurface(surface);
}
