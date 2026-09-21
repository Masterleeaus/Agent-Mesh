import 'dart:async';

import 'package:flutter/material.dart';
import 'package:titan_zero_mobile/screens/titan_shell_screen.dart';
import 'package:titan_zero_mobile/titan/core/titan_session.dart';
import 'package:titan_zero_mobile/titan/services/http_titan_surface_transport.dart';
import 'package:titan_zero_mobile/titan/services/titan_gateway.dart';

class SplashScreen extends StatefulWidget {
  const SplashScreen({super.key});

  @override
  State<SplashScreen> createState() => _SplashScreenState();
}

class _SplashScreenState extends State<SplashScreen> {
  TitanGateway _productionGateway() {
    const companyId = String.fromEnvironment('TITAN_COMPANY_ID');
    const actorId = String.fromEnvironment('TITAN_ACTOR_ID');
    const deviceId = String.fromEnvironment('TITAN_DEVICE_ID');
    const surface = String.fromEnvironment('TITAN_SURFACE', defaultValue: 'zero');
    const projectionUrl = String.fromEnvironment('TITAN_SURFACE_PROJECTION_URL');
    const commandUrl = String.fromEnvironment('TITAN_SURFACE_COMMAND_URL');
    const token = String.fromEnvironment('TITAN_AUTH_TOKEN');
    if ([companyId, actorId, deviceId, projectionUrl, commandUrl].any((v) => v.isEmpty)) {
      throw StateError('titan-mobile-runtime-configuration-required');
    }
    final session = TitanSession(companyId: companyId, actorId: actorId, deviceId: deviceId, surface: surface);
    return SurfaceSdkTitanGateway(session, HttpTitanSurfaceTransport(
      projectionEndpoint: Uri.parse(projectionUrl),
      commandEndpoint: Uri.parse(commandUrl),
      bearerToken: token.isEmpty ? null : token,
    ));
  }

  @override
  void initState() {
    super.initState();
    Timer(const Duration(milliseconds: 500), () {
      if (!mounted) return;
      Navigator.pushAndRemoveUntil(
        context,
        MaterialPageRoute(builder: (_) => TitanShellScreen(gateway: _productionGateway())),
        (_) => false,
      );
    });
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
          ],
        ),
      ),
    );
  }
}
