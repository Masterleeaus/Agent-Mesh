import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:titan_zero_mobile/screens/splash_screen.dart';

void main() {
  testWidgets('bootstrap failure stays visible with a retry action',
      (tester) async {
    await tester.pumpWidget(const MaterialApp(home: SplashScreen()));
    await tester.pump(const Duration(milliseconds: 600));
    await tester.pump();

    expect(
      find.text(
        'Titan could not establish a secure session. Check your connection or sign in again.',
      ),
      findsOneWidget,
    );
    expect(find.text('Retry'), findsOneWidget);
  });
}
