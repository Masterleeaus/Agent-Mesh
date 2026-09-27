import 'dart:io';
import 'package:flutter_test/flutter_test.dart';

void main(){
  test('Storage Fabric detail remains in System and exactly-three home invariant remains',(){
    final system=File(
      'lib/titan/screens/titan_system_status_screen.dart',
    ).readAsStringSync();
    final zero=File(
      'lib/screens/titan_shell_screen.dart',
    ).readAsStringSync();
    expect(system,contains('Storage Fabric'));
    expect(system,contains('phone not canonical'));
    expect(system,contains('recovery only'));
    expect(zero,contains('_projection.priorityStaff.take(3)'));
  });
}
