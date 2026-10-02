import 'titan_session.dart';

class MobileScopeKey {
  final String companyId;
  final String actorId;
  final String deviceId;
  final String surface;
  final String contextRevision;

  const MobileScopeKey({
    required this.companyId,
    required this.actorId,
    required this.deviceId,
    required this.surface,
    required this.contextRevision,
  });

  String get storageKey => 'titan_scope_v1/$companyId/$actorId/$deviceId/$surface/$contextRevision';

  @override
  bool operator ==(Object other) => other is MobileScopeKey &&
      other.companyId == companyId &&
      other.actorId == actorId &&
      other.deviceId == deviceId &&
      other.surface == surface &&
      other.contextRevision == contextRevision;

  @override
  int get hashCode => Object.hash(companyId, actorId, deviceId, surface, contextRevision);
}

class MobileContextScope {
  MobileScopeKey key;
  bool frozen = false;
  final Set<String> quarantinedIntentIds = <String>{};

  MobileContextScope(this.key);

  void freeze() => frozen = true;

  void assertWritable() {
    if (frozen) throw StateError('mobile-context-frozen');
  }

  MobileContextScope transition({
    required TitanSession session,
    required String contextRevision,
  }) {
    assertWritable();
    freeze();
    return MobileContextScope(MobileScopeKey(
      companyId: session.companyId,
      actorId: session.actorId,
      deviceId: session.deviceId,
      surface: session.surface,
      contextRevision: contextRevision,
    ));
  }

  void quarantine(String intentId) {
    if (intentId.trim().isEmpty) throw ArgumentError.value(intentId, 'intentId');
    quarantinedIntentIds.add(intentId);
  }

  bool canReplay({
    required String intentId,
    required MobileScopeKey intentScope,
    required MobileScopeKey currentScope,
  }) {
    if (intentScope != currentScope || intentScope != key || frozen) {
      quarantine(intentId);
      return false;
    }
    return true;
  }
}
