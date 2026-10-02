import 'package:flutter_test/flutter_test.dart';
import 'package:titan_zero_mobile/titan/core/mobile_session_context.dart';
import 'package:titan_zero_mobile/titan/core/titan_session.dart';

void main() {
  TitanSession session(String company, String surface) => TitanSession(
    companyId: company,
    actorId: 'actor-1',
    deviceId: 'device-1',
    surface: surface,
  );

  test('session context is blocked until server authority is revalidated', () {
    final context = MobileSessionContext(
      session: session('company-a', 'go'),
      contextRevision: 'rev-a',
      entitlements: {'work.read'},
      bearerToken: 'token-a',
    );
    expect(context.canReplay, isFalse);
    expect(() => context.assertReplayAllowed(context.scope), throwsStateError);

    context.revalidate(
      nextSession: session('company-a', 'go'),
      contextRevision: 'rev-b',
      nextEntitlements: {'work.read', 'work.update'},
      token: 'token-b',
    );
    expect(context.canReplay, isTrue);
    expect(context.entitlements, contains('work.update'));
  });

  test('company transition and token invalidation prevent stale replay', () {
    final context = MobileSessionContext(
      session: session('company-a', 'zero'),
      contextRevision: 'rev-a',
      entitlements: {'work.read'},
      bearerToken: 'token-a',
    );
    context.revalidate(
      nextSession: session('company-a', 'zero'),
      contextRevision: 'rev-a',
      nextEntitlements: {'work.read'},
      token: 'token-a',
    );
    final oldScope = context.scope;
    context.beginTransition();
    expect(context.canReplay, isFalse);
    expect(() => context.assertReplayAllowed(oldScope), throwsStateError);

    context.revalidate(
      nextSession: session('company-b', 'zero'),
      contextRevision: 'rev-b',
      nextEntitlements: {'work.read'},
      token: 'token-b',
    );
    expect(context.acceptsScope(oldScope), isFalse);
    context.invalidate();
    expect(context.canReplay, isFalse);
    expect(context.bearerToken, isNull);
  });
}
