import 'package:flutter_test/flutter_test.dart';
import '../lib/titan/release/mobile_release_certification.dart';

void main(){
  test('release fails closed without complete physical evidence',(){
    const candidate=TitanMobileReleaseCandidate(releaseId:'r1',companyId:'c1',version:'1',buildSha256:'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',platform:'android',signingIdentityRef:'sig:1',rollbackArtifactRef:'artifact:0',evidence:[]);
    expect(TitanMobileReleaseCertification().certified(candidate),isFalse);
  });
  test('all mandatory certification evidence is explicit',(){
    expect(TitanMobileReleaseCertification.requiredEvidence.contains('low_connectivity'),isTrue);
    expect(TitanMobileReleaseCertification.requiredEvidence.contains('accessibility'),isTrue);
    expect(TitanMobileReleaseCertification.requiredEvidence.contains('remote_wipe'),isTrue);
  });
  test('physical certification requires provenance and rejects simulated or duplicate evidence',(){
    const candidate=TitanMobileReleaseCandidate(releaseId:'r1',companyId:'c1',version:'1',buildSha256:'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',platform:'android',signingIdentityRef:'sig:1',rollbackArtifactRef:'artifact:0',deviceModel:'Pixel',osVersion:'14',sourceBuildSha256:'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',evidence:[TitanMobileReleaseEvidence('signed_build',true,'ci:1',simulated:true),TitanMobileReleaseEvidence('signed_build',true,'ci:2')]);
    final blockers=TitanMobileReleaseCertification().blockers(candidate);
    expect(blockers,contains('evidence:signed_build:simulated'));
    expect(blockers,contains('evidence_id_duplicate_or_missing'));
  });
}

