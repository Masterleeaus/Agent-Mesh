import 'dart:async';

import 'package:flutter/material.dart';
import 'package:titan_zero_mobile/screens/titan_shell_screen.dart';
import 'package:titan_zero_mobile/titan/core/titan_session.dart';
import 'package:titan_zero_mobile/titan/services/http_titan_surface_transport.dart';
import 'package:titan_zero_mobile/titan/services/titan_gateway.dart';

typedef TitanGatewayFactory = TitanGateway Function();

TitanGateway createProductionTitanGateway() {
  const companyId = String.fromEnvironment('TITAN_COMPANY_ID');
  const actorId = String.fromEnvironment('TITAN_ACTOR_ID');
  const deviceId = String.fromEnvironment('TITAN_DEVICE_ID');
  const surface = String.fromEnvironment('TITAN_SURFACE', defaultValue: 'zero');
  const projectionUrl = String.fromEnvironment('TITAN_SURFACE_PROJECTION_URL');
  const commandUrl = String.fromEnvironment('TITAN_SURFACE_COMMAND_URL');
  const conversationUrl = String.fromEnvironment('TITAN_CONVERSATION_URL');
  const token = String.fromEnvironment('TITAN_AUTH_TOKEN');

  if ([companyId, actorId, deviceId, projectionUrl, commandUrl, conversationUrl]
      .any((value) => value.isEmpty)) {
    throw StateError('titan-mobile-runtime-configuration-required');
  }

  final session = TitanSession(
    companyId: companyId,
    actorId: actorId,
    deviceId: deviceId,
    surface: surface,
  );
  final bearerToken = token.isEmpty ? null : token;
  return SurfaceSdkTitanGateway(
    session,
    HttpTitanSurfaceTransport(
      projectionEndpoint: Uri.parse(projectionUrl),
      commandEndpoint: Uri.parse(commandUrl),
      bearerToken: bearerToken,
    ),
    conversationTransport: HttpTitanConversationTransport(
      endpoint: Uri.parse(conversationUrl),
      bearerToken: bearerToken,
    ),
  );
}

class SplashScreen extends StatefulWidget {
  final TitanGatewayFactory gatewayFactory;

  const SplashScreen({
    super.key,
    TitanGatewayFactory? gatewayFactory,
  }) : gatewayFactory = gatewayFactory ?? createProductionTitanGateway;

  @override
  State<SplashScreen> createState() => _SplashScreenState();
}

class _SplashScreenState extends State<SplashScreen> {
  Timer? _timer;
  String? _configurationError;

  @override
  void initState() {
    super.initState();
    _timer = Timer(const Duration(milliseconds: 500), _openShell);
  }

  void _openShell() {
    if (!mounted) return;
    try {
      final gateway = widget.gatewayFactory();
      Navigator.pushAndRemoveUntil(
        context,
        MaterialPageRoute(builder: (_) => TitanShellScreen(gateway: gateway)),
        (_) => false,
      );
    } catch (error) {
      setState(() => _configurationError = error.toString());
    }
  }

  @override
  void dispose() {
    _timer?.cancel();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final error = _configurationError;
    if (error != null) {
      return Scaffold(
        key: const Key('runtime-configuration-error'),
        body: Center(
          child: Padding(
            padding: const EdgeInsets.all(24),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                const Icon(Icons.cloud_off_outlined, size: 56),
                const SizedBox(height: 16),
                const Text(
                  'Titan needs a hosted runtime configuration before it can open.',
                  textAlign: TextAlign.center,
                ),
                const SizedBox(height: 8),
                Text(
                  'Check the company, actor, device and hosted endpoint settings, then retry.',
                  textAlign: TextAlign.center,
                  style: Theme.of(context).textTheme.bodyMedium,
                ),
                const SizedBox(height: 16),
                FilledButton(
                  onPressed: () {
                    setState(() => _configurationError = null);
                    _timer = Timer(const Duration(milliseconds: 1), _openShell);
                  },
                  child: const Text('Retry'),
                ),
                const SizedBox(height: 8),
                Text(
                  error,
                  key: const Key('runtime-configuration-detail'),
                  textAlign: TextAlign.center,
                  style: Theme.of(context).textTheme.bodySmall,
                ),
              ],
            ),
          ),
        ),
      );
    }

    return const Scaffold(
      body: Center(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(Icons.change_history_rounded, size: 72),
            SizedBox(height: 12),
            Text(
              'TITAN ZERO',
              style: TextStyle(fontSize: 22, fontWeight: FontWeight.w700),
            ),
          ],
        ),
      ),
    );
  }
}
