/// Flutter mirror of packages/titan-platform/src/surface/index.ts.
/// Keep this DTO contract schema-compatible with Titan Core; it grants no authority.
enum TitanSurface { zero, go, hub }

TitanSurface titanSurfaceFromWire(String value) {
  switch (value) {
    case 'zero':
    case 'command':
      return TitanSurface.zero;
    case 'go':
      return TitanSurface.go;
    case 'hub':
      return TitanSurface.hub;
    default:
      throw FormatException('canonical-surface-required');
  }
}

String titanSurfaceToWire(TitanSurface surface) => switch (surface) {
  TitanSurface.zero => 'zero',
  TitanSurface.go => 'go',
  TitanSurface.hub => 'hub',
};

class TitanSurfaceCapability {
  final String capabilityId;
  final List<String> operations;
  final bool mutation;
  final String offline;
  final bool requiresReceipt;
  final String? authorityCeiling;
  const TitanSurfaceCapability({required this.capabilityId, required this.operations, required this.mutation, required this.offline, required this.requiresReceipt, this.authorityCeiling});
  factory TitanSurfaceCapability.fromJson(Map<String,dynamic> json) => TitanSurfaceCapability(
    capabilityId: json['capability_id'] as String,
    operations: List<String>.from(json['operations'] as List),
    mutation: json['mutation'] == true,
    offline: (json['offline'] as String?) ?? 'read',
    requiresReceipt: json['requires_receipt'] == true,
    authorityCeiling: json['authority_ceiling'] as String?,
  );
}

class TitanSurfaceProjection {
  final String companyId;
  final TitanSurface surface;
  final String actorId;
  final String revision;
  final DateTime issuedAt;
  final DateTime expiresAt;
  final List<TitanSurfaceCapability> capabilities;
  final Map<String,dynamic> data;
  const TitanSurfaceProjection({required this.companyId, required this.surface, required this.actorId, required this.revision, required this.issuedAt, required this.expiresAt, required this.capabilities, required this.data});
  factory TitanSurfaceProjection.fromJson(Map<String,dynamic> json) {
    if (json.containsKey('tenant_company_id') || json.containsKey('tenant_id')) throw const FormatException('tenant_company_id-not-authoritative');
    final companyId=(json['company_id'] as String?)?.trim() ?? '';
    if (companyId.isEmpty) throw const FormatException('company_id-required');
    if (json['authority_neutral'] != true || json['identity_grants_authority'] != false || json['cached_state_grants_authority'] != false) throw const FormatException('surface-authority-contract-invalid');
    return TitanSurfaceProjection(
      companyId:companyId,
      surface:titanSurfaceFromWire(json['surface'] as String),
      actorId:json['actor_id'] as String,
      revision:json['revision'] as String,
      issuedAt:DateTime.parse(json['issued_at'] as String),
      expiresAt:DateTime.parse(json['expires_at'] as String),
      capabilities:(json['capabilities'] as List).map((e)=>TitanSurfaceCapability.fromJson(Map<String,dynamic>.from(e as Map))).toList(growable:false),
      data:Map<String,dynamic>.from((json['data'] as Map?) ?? const {}),
    );
  }
  TitanSurfaceCapability requireCapability(String id,String operation,{DateTime? now}) {
    if (!expiresAt.isAfter(now ?? DateTime.now().toUtc())) throw StateError('surface-projection-expired');
    return capabilities.firstWhere((c)=>c.capabilityId==id && c.operations.contains(operation),orElse:()=>throw StateError('surface-capability-not-authorised'));
  }
}
