class TitanReleaseUpdatePolicy {
  final String currentVersion;
  final String targetVersion;
  final String targetSha256;
  final String signedManifestRef;
  final String rollbackVersion;
  final String rollbackSha256;
  final bool mandatory;
  final String platform;
  final String sourceBuildSha256;
  final String signingIdentityRef;
  final String minimumApiVersion;
  final String rollbackManifestRef;
  const TitanReleaseUpdatePolicy({required this.currentVersion,required this.targetVersion,required this.targetSha256,required this.signedManifestRef,required this.rollbackVersion,required this.rollbackSha256,required this.mandatory,required this.platform,required this.sourceBuildSha256,required this.signingIdentityRef,required this.minimumApiVersion,required this.rollbackManifestRef});

  void validate(){
    if(targetVersion==currentVersion)throw StateError('update must change version');
    if(!_sha256.hasMatch(targetSha256)||!_sha256.hasMatch(rollbackSha256)||!_sha256.hasMatch(sourceBuildSha256))throw StateError('release digests must be sha256');
    if(signedManifestRef.trim().isEmpty||rollbackManifestRef.trim().isEmpty)throw StateError('signed release manifests required');
    if(signingIdentityRef.trim().isEmpty)throw StateError('signing identity reference required');
    if(!{'android','ios'}.contains(platform))throw StateError('unsupported release platform');
    if(rollbackVersion.trim().isEmpty||rollbackVersion==targetVersion)throw StateError('rollback version invalid');
    if(_compareVersions(rollbackVersion,targetVersion)>=0)throw StateError('rollback must precede target');
    if(minimumApiVersion.trim().isEmpty)throw StateError('minimum API version required');
  }

  static final _sha256=RegExp(r'^[0-9a-fA-F]{64}$');
  static int _compareVersions(String left,String right){
    final a=left.split('.').map((part)=>int.tryParse(part)??-1).toList();
    final b=right.split('.').map((part)=>int.tryParse(part)??-1).toList();
    for(var i=0;i<3;i++){final av=i<a.length?a[i]:0;final bv=i<b.length?b[i]:0;if(av!=bv)return av.compareTo(bv);} return 0;
  }
}

