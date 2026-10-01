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
  String? _bootstrapError;
  Timer? _bootstrapTimer;

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
    final session = TitanSession(
      companyId: companyId,
      actorId: actorId,
      deviceId: deviceId,
      surface: surface,
    );
    return SurfaceSdkTitanGateway(
      session,
      HttpTitanSurfaceTransport(
        projectionEndpoint: Uri.parse(projectionUrl),
        commandEndpoint: Uri.parse(commandUrl),
        bearerToken: token.isEmpty ? null : token,
      ),
    );
  }

  void _bootstrap() {
    try {
      final gateway = _productionGateway();
      if (!mounted) return;
      Navigator.pushAndRemoveUntil(
        context,
        MaterialPageRoute(builder: (_) => TitanShellScreen(gateway: gateway)),
        (_) => false,
      );
    } on StateError catch (error) {
      if (!mounted) return;
      setState(() => _bootstrapError = _safeBootstrapMessage(error));
    } on ArgumentError catch (error) {
      if (!mounted) return;
      setState(() => _bootstrapError = _safeBootstrapMessage(error));
    }
  }

  String _safeBootstrapMessage(Object error) {
    if (error.toString().contains('configuration-required')) {
      return 'Titan is not configured for this device. Ask your administrator for a managed release build.';
    }
    return 'Titan could not start securely. Check the connection or sign in again, then retry.';
  }

  @override
  void initState() {
    super.initState();
    _bootstrapTimer = Timer(const Duration(milliseconds: 500), _bootstrap);
  }

  @override
  void dispose() {
    _bootstrapTimer?.cancel();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final error = _bootstrapError;
    return Scaffold(
      body: Center(
        child: Padding(
          padding: const EdgeInsets.all(24),
          child: error == null
              ? const Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Icon(Icons.change_history_rounded, size: 72),
                    SizedBox(height: 12),
                    Text('TITAN ZERO', style: TextStyle(fontSize: 22, fontWeight: FontWeight.w700)),
                    SizedBox(height: 16),
                    CircularProgressIndicator(),
                  ],
                )
              : Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    const Icon(Icons.lock_outline, size: 56),
                    const SizedBox(height: 16),
                    const Text(
                      'Titan could not start',
                      key: Key('mobile-runtime-configuration-error'),
                      style: TextStyle(fontSize: 22, fontWeight: FontWeight.w700),
                      textAlign: TextAlign.center,
                    ),
                    const SizedBox(height: 12),
                    Text(error, textAlign: TextAlign.center),
                    const SizedBox(height: 20),
                    FilledButton(
                      onPressed: () => setState(() {
                        _bootstrapError = null;
                        _bootstrapTimer = Timer(const Duration(milliseconds: 1), _bootstrap);
                      }),
                      child: const Text('Retry'),
                    ),
                  ],
                ),
        ),
      ),
    );
  }
}
