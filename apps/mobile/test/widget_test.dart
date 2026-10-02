import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:titan_zero_mobile/screens/splash_screen.dart';
import 'package:titan_zero_mobile/titan/models/generative_item.dart';
import 'package:titan_zero_mobile/titan/services/titan_gateway.dart';

class _NoopGateway implements TitanGateway {
  @override
  Future<List<TitanGenerativeItem>> converse(String message) async => const [];

  @override
  Future<void> command(
    String capability,
    Map<String, dynamic> payload, {
    String? operation,
    bool onlineRequired = false,
  }) async {}
}

void main() {
  testWidgets('configured splash opens the Titan shell', (tester) async {
    await tester.pumpWidget(
      MaterialApp(
        home: SplashScreen(gatewayFactory: () => _NoopGateway()),
      ),
    );

    await tester.pump(const Duration(milliseconds: 600));
    await tester.pumpAndSettle();

    expect(find.text('Titan Zero'), findsOneWidget);
    expect(find.text('Ask Titan…'), findsOneWidget);
  });

  testWidgets('missing hosted configuration is recoverable', (tester) async {
    await tester.pumpWidget(const MaterialApp(home: SplashScreen()));

    await tester.pump(const Duration(milliseconds: 600));

    expect(find.byKey(const Key('runtime-configuration-error')), findsOneWidget);
    expect(find.text('Retry'), findsOneWidget);
    expect(find.textContaining('hosted runtime configuration'), findsOneWidget);
  });
}
