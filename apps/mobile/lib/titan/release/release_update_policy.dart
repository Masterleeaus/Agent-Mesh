class TitanReleaseUpdatePolicy {
  final String currentVersion;
  final String targetVersion;
  final String targetSha256;
  final String signedManifestRef;
  final String rollbackVersion;
  final String rollbackSha256;
  final bool mandatory;
  const TitanReleaseUpdatePolicy({required this.currentVersion,required this.targetVersion,required this.targetSha256,required this.signedManifestRef,required this.rollbackVersion,required this.rollbackSha256,required this.mandatory});

  void validate(){
    if(targetVersion==currentVersion)throw StateError('update must change version');
    if(targetSha256.length!=64||rollbackSha256.length!=64)throw StateError('release digests must be sha256');
    if(signedManifestRef.trim().isEmpty)throw StateError('signed release manifest required');
    if(rollbackVersion.trim().isEmpty)throw StateError('rollback version required');
  }
}
