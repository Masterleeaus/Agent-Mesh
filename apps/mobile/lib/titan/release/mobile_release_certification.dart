class TitanMobileReleaseEvidence {
  final String id;
  final bool passed;
  final String evidenceRef;
  const TitanMobileReleaseEvidence(this.id,this.passed,this.evidenceRef);
}

class TitanMobileReleaseCandidate {
  final String releaseId;
  final String companyId;
  final String version;
  final String buildSha256;
  final String platform;
  final String signingIdentityRef;
  final String rollbackArtifactRef;
  final List<TitanMobileReleaseEvidence> evidence;
  const TitanMobileReleaseCandidate({required this.releaseId,required this.companyId,required this.version,required this.buildSha256,required this.platform,required this.signingIdentityRef,required this.rollbackArtifactRef,required this.evidence});
}

class TitanMobileReleaseCertification {
  static const requiredEvidence=<String>{
    'company_boundary','canonical_surfaces','authority_contraction','offline_revalidation',
    'secure_key_path','remote_revocation','remote_wipe','incident_repair','signed_build',
    'rollback','low_connectivity','security','accessibility','performance'
  };

  List<String> blockers(TitanMobileReleaseCandidate candidate){
    final blockers=<String>[];
    if(candidate.companyId.trim().isEmpty)blockers.add('company_id_missing');
    if(candidate.buildSha256.length!=64)blockers.add('build_digest_invalid');
    if(!const {'ios','android'}.contains(candidate.platform))blockers.add('platform_invalid');
    if(candidate.signingIdentityRef.trim().isEmpty)blockers.add('signing_identity_missing');
    if(candidate.rollbackArtifactRef.trim().isEmpty)blockers.add('rollback_artifact_missing');
    final byId={for(final e in candidate.evidence)e.id:e};
    for(final id in requiredEvidence){
      final e=byId[id];
      if(e==null||!e.passed||e.evidenceRef.trim().isEmpty)blockers.add('evidence:$id');
    }
    return blockers;
  }

  bool certified(TitanMobileReleaseCandidate candidate)=>blockers(candidate).isEmpty;
}
