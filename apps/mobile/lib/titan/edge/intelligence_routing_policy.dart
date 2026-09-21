import 'private_intelligence_route.dart';

class TitanIntelligenceRoutingPolicy {
  final String policyId;
  final int version;
  final String companyId;
  final DateTime issuedAt;
  final DateTime? expiresAt;
  final bool stale;
  final TitanIntelligenceRoutePolicy routePolicy;
  final Set<String> allowedEgressClasses;
  final Set<String> prohibitedDataClasses;

  const TitanIntelligenceRoutingPolicy({
    required this.policyId,
    required this.version,
    required this.companyId,
    required this.issuedAt,
    required this.routePolicy,
    this.expiresAt,
    this.stale=false,
    this.allowedEgressClasses=const {},
    this.prohibitedDataClasses=const {},
  });

  bool usableAt(DateTime now)=>!stale&&
      (expiresAt==null||now.toUtc().isBefore(expiresAt!.toUtc()));

  bool permitsDataClass(String dataClass)=>
      !prohibitedDataClasses.contains(dataClass);
}
