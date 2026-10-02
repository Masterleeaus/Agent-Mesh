import 'package:flutter_test/flutter_test.dart';
import '../lib/titan/release/release_update_policy.dart';

void main(){
  const digest='aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa';
  TitanReleaseUpdatePolicy policy({String rollbackVersion='1.9.0',String platform='android'})=>TitanReleaseUpdatePolicy(
    currentVersion:'1.8.0',targetVersion:'2.0.0',targetSha256:digest,signedManifestRef:'manifest:2',rollbackVersion:rollbackVersion,rollbackSha256:digest,mandatory:true,platform:platform,sourceBuildSha256:digest,signingIdentityRef:'ci:key:android',minimumApiVersion:'core-4',rollbackManifestRef:'manifest:1',
  );
  test('accepts a signed compatible release with an older rollback artifact',()=>policy().validate());
  test('rejects unsigned, unsupported, or non-rollback targets',(){
    expect(()=>policy(platform:'linux').validate(),throwsStateError);
    expect(()=>policy(rollbackVersion:'2.1.0').validate(),throwsStateError);
    expect(()=>TitanReleaseUpdatePolicy(currentVersion:'1',targetVersion:'2',targetSha256:digest,signedManifestRef:'manifest:2',rollbackVersion:'1',rollbackSha256:digest,mandatory:true,platform:'android',sourceBuildSha256:'bad',signingIdentityRef:'',minimumApiVersion:'',rollbackManifestRef:'').validate(),throwsStateError);
  });
}

