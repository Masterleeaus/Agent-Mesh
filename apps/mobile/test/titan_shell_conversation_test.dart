import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:titan_zero_mobile/screens/titan_shell_screen.dart';
import 'package:titan_zero_mobile/titan/models/generative_item.dart';
import 'package:titan_zero_mobile/titan/services/titan_gateway.dart';

class _RejectingGateway implements TitanGateway {
  @override
  Future<List<TitanGenerativeItem>> converse(String message) async => throw StateError('offline');

  @override
  Future<void> command(String capability, Map<String, dynamic> payload, {String? operation, bool onlineRequired = false}) async {}
}

void main() {
  testWidgets('failed conversation keeps the message and explains how to recover', (tester) async {
    await tester.pumpWidget(MaterialApp(home: TitanShellScreen(gateway: _RejectingGateway())));
    await tester.enterText(find.byType(TextField).last, 'Tell me my next appointment');
    await tester.tap(find.byIcon(Icons.arrow_upward));
    await tester.pumpAndSettle();

    expect(find.text('Tell me my next appointment'), findsOneWidget);
    expect(find.byKey(const Key('conversation-send-error')), findsOneWidget);
    expect(find.textContaining('check your connection or sign in again'), findsOneWidget);
  });

  testWidgets('context actions fail closed instead of opening seeded records', (tester) async {
    await tester.pumpWidget(MaterialApp(home: TitanShellScreen(gateway: _RejectingGateway())));
    await tester.tap(find.text('Evidence'));
    await tester.pump();

    expect(find.textContaining('server-scoped job'), findsOneWidget);
    expect(find.byKey(const Key('conversation-send-error')), findsOneWidget);
  });

  testWidgets('shell controls explain unavailable hosted capabilities', (tester) async {
    await tester.pumpWidget(MaterialApp(home: TitanShellScreen(gateway: _RejectingGateway())));
    await tester.tap(find.byIcon(Icons.notifications_none));
    await tester.pump();

    expect(find.textContaining('hosted attention projection'), findsOneWidget);

    await tester.tap(find.byIcon(Icons.mic_none));
    await tester.pump();

    expect(find.textContaining('hosted capability and permission state'), findsOneWidget);
  });

}

class _RecordingGateway implements TitanGateway {
  final messages = <String>[];
  @override
  Future<List<TitanGenerativeItem>> converse(String message) async {
    messages.add(message);
    if (messages.length == 1) {
      return const [
        TitanGenerativeItem(
          type: TitanGenerativeType.job,
          title: 'Demo job',
          actions: ['Open job'],
          context: {'job_id': 'job-101'},
        ),
      ];
    }
    return const [];
  }

  @override
  Future<void> command(String capability, Map<String, dynamic> payload,
      {String? operation, bool onlineRequired = false}) async {}
}

