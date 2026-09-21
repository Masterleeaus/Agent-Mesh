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
}
