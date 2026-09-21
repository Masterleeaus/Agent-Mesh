import 'dart:io';
import 'package:flutter_test/flutter_test.dart';

void main(){
  test('Storage Fabric diagnostics stay in System details and home remains three cards',(){
    final system=File(
      'lib/titan/screens/titan_system_status_screen.dart',
    ).readAsStringSync();
    final zero=File(
      'lib/screens/titan_shell_screen.dart',
    ).readAsStringSync();
    expect(system,contains('Storage Fabric'));
    expect(system,contains('Storage authority'));
    expect(system,contains('phone not canonical'));
    expect(zero,contains('_projection.priorityStaff.take(3)'));
  });

  test('mobile runtime exposes staged restore rather than canonical promotion',(){
    final runtime=File(
      'lib/titan/edge/mobile_edge_runtime.dart',
    ).readAsStringSync();
    expect(runtime,contains('stageStorageRestore'));
    expect(runtime,contains('TitanStorageRestoreStagingRepository'));
    expect(runtime,isNot(contains('promoteStorageCanonical')));
  });
}
