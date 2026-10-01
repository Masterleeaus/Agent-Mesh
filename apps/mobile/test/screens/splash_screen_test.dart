import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:titan_zero_mobile/screens/splash_screen.dart';

void main() {
  testWidgets('missing production configuration fails closed with a recoverable message', (tester) async {
    await tester.pumpWidget(const MaterialApp(home: SplashScreen()));
    await tester.pump(const Duration(milliseconds: 600));

    expect(find.byKey(const Key('mobile-runtime-configuration-error')), findsOneWidget);
    expect(find.textContaining('not configured for this device'), findsOneWidget);
    expect(find.text('Retry'), findsOneWidget);
    expect(find.byType(TitanShellScreen), findsNothing);
  });
}
