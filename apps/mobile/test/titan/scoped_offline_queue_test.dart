import 'package:flutter_test/flutter_test.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:titan_zero_mobile/titan/core/mobile_context_scope.dart';
import 'package:titan_zero_mobile/titan/models/titan_command.dart';
import 'package:titan_zero_mobile/titan/services/offline_command_queue.dart';

void main() {
  TitanCommand command(String id, MobileScopeKey scope) => TitanCommand(
    id: id, capability: 'work.read', payload: const {}, createdAt: DateTime.utc(2026, 1, 1),
    explicitScope: scope,
  );

  test('company and surface queues are physically partitioned', () async {
    SharedPreferences.setMockInitialValues({});
    final zeroA = ScopedOfflineCommandQueue(const MobileScopeKey(
      companyId: 'company-a', actorId: 'actor-a', deviceId: 'device-a',
      surface: 'zero', contextRevision: 'rev-a',
    ));
    final goB = ScopedOfflineCommandQueue(const MobileScopeKey(
      companyId: 'company-b', actorId: 'actor-a', deviceId: 'device-a',
      surface: 'go', contextRevision: 'rev-b',
    ));
    await zeroA.enqueue(command('a-1', zeroA.scope!));
    expect((await zeroA.all()).map((item) => item.id), contains('a-1'));
    expect(await goB.all(), isEmpty);
  });

  test('quarantine removes the old scope before a company transition', () async {
    SharedPreferences.setMockInitialValues({});
    final queue = ScopedOfflineCommandQueue(const MobileScopeKey(
      companyId: 'company-a', actorId: 'actor-a', deviceId: 'device-a',
      surface: 'zero', contextRevision: 'rev-a',
    ));
    await queue.enqueue(command('old-intent', queue.scope!));
    final quarantined = await queue.quarantineAll();
    expect(quarantined.single.id, 'old-intent');
    expect(await queue.all(), isEmpty);

    // Quarantine survives queue reconstruction and another company's session
    // cannot move the old command back into an active replay queue.
    final reconstructed = ScopedOfflineCommandQueue(queue.scope!);
    expect((await reconstructed.quarantined()).single.id, 'old-intent');
    final companyB = ScopedOfflineCommandQueue(const MobileScopeKey(
      companyId: 'company-b', actorId: 'actor-a', deviceId: 'device-a',
      surface: 'zero', contextRevision: 'rev-b',
    ));
    await expectLater(
      companyB.restoreQuarantinedAfterRevalidation(validatedScope: queue.scope!),
      throwsStateError,
    );
    expect(await companyB.all(), isEmpty);

    final restored = await reconstructed.restoreQuarantinedAfterRevalidation(
      validatedScope: queue.scope!,
    );
    expect(restored.single.id, 'old-intent');
    expect((await reconstructed.all()).single.id, 'old-intent');
    expect(await reconstructed.quarantined(), isEmpty);
  });

  test('scoped queue rejects a command from another company or mode', () async {
    SharedPreferences.setMockInitialValues({});
    final zeroA = const MobileScopeKey(
      companyId: 'company-a', actorId: 'actor-a', deviceId: 'device-a',
      surface: 'zero', contextRevision: 'rev-a',
    );
    final goB = const MobileScopeKey(
      companyId: 'company-b', actorId: 'actor-a', deviceId: 'device-a',
      surface: 'go', contextRevision: 'rev-b',
    );
    final queue = ScopedOfflineCommandQueue(zeroA);
    expect(queue.enqueue(command('cross-scope', goB)), throwsStateError);
  });
}
