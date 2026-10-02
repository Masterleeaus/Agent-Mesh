import 'package:flutter_test/flutter_test.dart';
import 'package:titan_zero_mobile/titan/core/mobile_context_scope.dart';
import 'package:titan_zero_mobile/titan/core/titan_session.dart';

void main() {
  TitanSession session(String company, String surface) => TitanSession(
    companyId: company, actorId: 'actor-1', deviceId: 'device-1', surface: surface,
  );

  test('mode transition freezes old scope and creates a separate storage partition', () {
    final old = MobileContextScope(MobileScopeKey(
      companyId: 'company-a', actorId: 'actor-1', deviceId: 'device-1',
      surface: 'zero', contextRevision: 'rev-a',
    ));
    final next = old.transition(session: session('company-a', 'go'), contextRevision: 'rev-b');
    expect(old.frozen, isTrue);
    expect(old.key.storageKey, isNot(next.key.storageKey));
    expect(next.key.surface, 'go');
  });

  test('company switch cannot replay old-company intents and quarantines them', () {
    final old = MobileContextScope(MobileScopeKey(
      companyId: 'company-a', actorId: 'actor-1', deviceId: 'device-1',
      surface: 'zero', contextRevision: 'rev-a',
    ));
    final oldKey = old.key;
    final current = old.transition(session: session('company-b', 'zero'), contextRevision: 'rev-b');
    expect(current.canReplay(intentId: 'intent-a', intentScope: oldKey, currentScope: current.key), isFalse);
    expect(current.quarantinedIntentIds, contains('intent-a'));
  });

  test('reassignment or stale revision is blocked by scope identity', () {
    final scope = MobileContextScope(MobileScopeKey(
      companyId: 'company-a', actorId: 'actor-1', deviceId: 'device-1',
      surface: 'go', contextRevision: 'rev-a',
    ));
    expect(scope.canReplay(
      intentId: 'intent-stale',
      intentScope: scope.key,
      currentScope: MobileScopeKey(
        companyId: 'company-a', actorId: 'actor-1', deviceId: 'device-1',
        surface: 'go', contextRevision: 'rev-b',
      ),
    ), isFalse);
    expect(scope.quarantinedIntentIds, contains('intent-stale'));
  });
}
