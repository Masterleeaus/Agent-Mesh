class TitanSession {
  static const Set<String> canonicalSurfaces = {'zero', 'go', 'hub'};

  final String companyId;
  final String actorId;
  final String deviceId;
  final String surface;

  TitanSession({
    required this.companyId,
    required this.actorId,
    required this.deviceId,
    this.surface = 'zero',
  }) {
    if (!canonicalSurfaces.contains(surface)) {
      throw ArgumentError.value(surface, 'surface', 'canonical-surface-required');
    }
  }

  Map<String, dynamic> toJson() => {
    'company_id': companyId,
    'actor_id': actorId,
    'device_id': deviceId,
    'surface': surface,
  };
}
