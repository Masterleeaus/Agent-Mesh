import 'dart:async';

import 'package:flutter/material.dart';
import 'package:titan_zero_mobile/screens/titan_shell_screen.dart';
import 'package:titan_zero_mobile/titan/core/mobile_bootstrap_config.dart';
import 'package:titan_zero_mobile/titan/services/http_titan_surface_transport.dart';
import 'package:titan_zero_mobile/titan/services/titan_gateway.dart';

class SplashScreen extends StatefulWidget {
  const SplashScreen({super.key});

  @override
  State<SplashScreen> createState() => _SplashScreenState();
}

class _SplashScreenState extends State<SplashScreen> {
  String? _bootstrapError;

  TitanGateway _productionGateway(MobileBootstrapConfig config) =>
      SurfaceSdkTitanGateway(
        config.session,
        HttpTitanSurfaceTransport(
          projectionEndpoint: config.projectionEndpoint,
          commandEndpoint: config.commandEndpoint,
          bearerToken: config.bearerToken,
        ),
      );

  Future<void> _openProduction() async {
    try {
      final config = await MobileBootstrapConfig.fromEnvironment();
      if (!mounted) return;
      await Navigator.pushAndRemoveUntil(
        context,
        MaterialPageRoute(
          builder: (_) => TitanShellScreen(gateway: _productionGateway(config)),
        ),
        (_) => false,
      );
    } catch (_) {
      if (!mounted) return;
      setState(() => _bootstrapError =
          'Titan could not establish a secure session. Check your connection or sign in again.');
    }
  }

  @override
  void initState() {
    super.initState();
    Timer(const Duration(milliseconds: 500), () => unawaited(_openProduction()));
  }

  @override
  Widget build(BuildContext context) {
    return const Scaffold(
      body: Center(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(Icons.change_history_rounded, size: 72),
            SizedBox(height: 12),
            Text('TITAN ZERO', style: TextStyle(fontSize: 22, fontWeight: FontWeight.w700)),
            if (_bootstrapError != null) ...[
              SizedBox(height: 12),
              Text(_bootstrapError!, textAlign: TextAlign.center),
              SizedBox(height: 8),
              TextButton(onPressed: () => unawaited(_openProduction()), child: Text('Retry')),
            ],
          ],
        ),
      ),
    );
  }
}
