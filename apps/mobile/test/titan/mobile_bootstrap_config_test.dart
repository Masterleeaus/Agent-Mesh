import 'package:flutter_test/flutter_test.dart';
import 'package:titan_zero_mobile/titan/core/mobile_bootstrap_config.dart';
import 'package:titan_zero_mobile/titan/core/titan_session.dart';

void main() {
  test('missing release defines fail closed before gateway creation', () {
    expect(
      MobileBootstrapConfig.fromEnvironment,
      throwsA(isA<StateError>()),
    );
  });

  test('bootstrap config retains canonical scope and never persists token', () {
    final config = MobileBootstrapConfig(
      session: TitanSession(companyId: 'company-a', actorId: 'actor-1', deviceId: 'device-1'),
      projectionEndpoint: Uri.parse('https://example.test/projection'),
      commandEndpoint: Uri.parse('https://example.test/command'),
    );
    expect(config.bearerToken, isNull);
  });
}
