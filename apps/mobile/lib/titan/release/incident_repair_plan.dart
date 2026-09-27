class TitanIncidentRepairPlan {
  final String companyId;
  final String incidentId;
  final String canonicalReceiptRef;
  final bool authorityContracted;
  final bool credentialsRotated;
  final bool localSecretsDestroyed;
  final bool reEnrollmentRequired;
  const TitanIncidentRepairPlan({required this.companyId,required this.incidentId,required this.canonicalReceiptRef,required this.authorityContracted,required this.credentialsRotated,required this.localSecretsDestroyed,required this.reEnrollmentRequired});

  bool get safeToReEnroll=>companyId.isNotEmpty&&incidentId.isNotEmpty&&canonicalReceiptRef.isNotEmpty&&authorityContracted&&credentialsRotated&&localSecretsDestroyed&&reEnrollmentRequired;
}
