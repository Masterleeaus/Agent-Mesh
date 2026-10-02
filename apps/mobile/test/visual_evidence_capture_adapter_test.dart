import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:titan_zero_mobile/titan/models/generative_item.dart';
import 'package:titan_zero_mobile/titan/screens/capture_screen.dart';
import 'package:titan_zero_mobile/titan/services/titan_gateway.dart';

class _CaptureGateway implements TitanGateway {
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
  testWidgets('capture screen keeps provider-neutral visual guidance optional',
      (tester) async {
    TitanEvidenceItem? offered;
    final screen = TitanCaptureScreen(
      jobId: 'job-1',
      gateway: _CaptureGateway(),
      onVisualEvidenceQueued: (item) async => offered = item,
    );

    await tester.pumpWidget(MaterialApp(home: screen));

    expect(find.text('Take photo'), findsOneWidget);
    expect(find.text('Evidence queue (0)'), findsOneWidget);
    expect(offered, isNull);
  });
}
