import 'package:flutter_test/flutter_test.dart';
import 'package:titan_zero_mobile/titan/core/mobile_audience_guard.dart';

void main() {
  test('Go requires the authenticated worker and current assignment revision', () {
    const guard = MobileAudienceGuard();
    expect(() => guard.validate(surface: 'go', actorId: 'worker-1', projection: const {}), throwsStateError);
    expect(() => guard.validate(surface: 'go', actorId: 'worker-1', projection: {
      'worker_id': 'worker-1', 'assignment_revision': 'assign-1',
    }), returnsNormally);
    expect(() => guard.validate(surface: 'go', actorId: 'worker-1', projection: {
      'worker_id': 'other-worker', 'assignment_revision': 'assign-1',
    }), throwsStateError);
  });

  test('Hub requires explicit customer-safe relationship scope', () {
    const guard = MobileAudienceGuard();
    expect(() => guard.validate(surface: 'hub', actorId: 'customer-1', projection: {
      'customer_safe': true, 'customer_id': 'customer-1', 'relationship_scope': ['site-1'],
    }), returnsNormally);
    expect(() => guard.validate(surface: 'hub', actorId: 'customer-1', projection: {
      'customer_safe': false, 'customer_id': 'customer-1', 'relationship_scope': ['site-1'],
    }), throwsStateError);
    expect(() => guard.validate(surface: 'hub', actorId: 'customer-1', projection: {
      'customer_safe': true, 'customer_id': 'customer-1', 'relationship_scope': ['site-1'], 'internal_notes': 'private',
    }), throwsStateError);
  });
}
