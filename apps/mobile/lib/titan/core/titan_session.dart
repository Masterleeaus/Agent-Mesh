class TitanSession {
  final String companyId;
  final String actorId;
  final String deviceId;
  final String surface;

  const TitanSession({
    required this.companyId,
    required this.actorId,
    required this.deviceId,
    this.surface = 'zero',
  }) : assert(surface == 'zero' || surface == 'go' || surface == 'hub');

  Map<String, dynamic> toJson() => {
    'company_id': companyId,
    'actor_id': actorId,
    'device_id': deviceId,
    'surface': surface,
  };
}
