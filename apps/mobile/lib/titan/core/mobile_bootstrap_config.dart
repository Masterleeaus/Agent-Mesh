import 'package:flutter/foundation.dart';
import 'titan_session.dart';
import '../storage/secure_store.dart';

/// Runtime identity and endpoints are build configuration, not authority.
/// Access tokens are read from the platform secure store and never from a
/// Dart define, URL, or ordinary preferences.
class MobileBootstrapConfig {
  final TitanSession session;
  final Uri projectionEndpoint;
  final Uri commandEndpoint;
  final Uri? conversationEndpoint;
  final String? bearerToken;

  const MobileBootstrapConfig({
    required this.session,
    required this.projectionEndpoint,
    required this.commandEndpoint,
    this.conversationEndpoint,
    this.bearerToken,
  });

  static Future<MobileBootstrapConfig> fromEnvironment({
    Future<String?> Function(String logicalKey)? readSecureToken,
  }) async {
    const companyId = String.fromEnvironment('TITAN_COMPANY_ID');
    const actorId = String.fromEnvironment('TITAN_ACTOR_ID');
    const deviceId = String.fromEnvironment('TITAN_DEVICE_ID');
    const surface = String.fromEnvironment('TITAN_SURFACE', defaultValue: 'zero');
    const projection = String.fromEnvironment('TITAN_SURFACE_PROJECTION_URL');
    const command = String.fromEnvironment('TITAN_SURFACE_COMMAND_URL');
    const conversation = String.fromEnvironment('TITAN_WORKFORCE_CONVERSATION_URL');
    if ([companyId, actorId, deviceId, projection, command].any((v) => v.trim().isEmpty)) {
      throw StateError('titan-mobile-runtime-configuration-required');
    }
    if (!TitanSession.canonicalSurfaces.contains(surface)) {
      throw StateError('canonical-surface-required');
    }
    final projectionUri = _httpsUri(projection, 'projection');
    final commandUri = _httpsUri(command, 'command');
    final conversationUri = conversation.trim().isEmpty ? null : _httpsUri(conversation, 'conversation');
    final tokenKey = 'mobile.session.access.v1::$companyId::$actorId::$deviceId::$surface';
    final token = await (readSecureToken ?? const TitanSecureStore().read)(tokenKey);
    if (kReleaseMode && (token?.trim().isEmpty ?? true)) {
      throw StateError('titan-mobile-auth-token-required');
    }
    return MobileBootstrapConfig(
      session: TitanSession(companyId: companyId, actorId: actorId, deviceId: deviceId, surface: surface),
      projectionEndpoint: projectionUri,
      commandEndpoint: commandUri,
      conversationEndpoint: conversationUri,
      bearerToken: token?.trim().isEmpty ?? true ? null : token,
    );
  }

  static Uri _httpsUri(String raw, String label) {
    final uri = Uri.tryParse(raw);
    if (uri == null || uri.host.isEmpty || (uri.scheme != 'https' && uri.host != 'localhost')) {
      throw StateError('titan-mobile-$label-endpoint-https-required');
    }
    return uri;
  }
}
