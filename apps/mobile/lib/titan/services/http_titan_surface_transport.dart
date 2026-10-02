import 'dart:convert';
import 'dart:io';

import 'titan_gateway.dart';

/// HTTP client for a configured hosted conversation endpoint. The endpoint and
/// auth mechanism are injected by the host integration; this client does not
/// infer an apps/web route or fall back to local/demo inference.
class HttpTitanConversationTransport implements TitanConversationTransport {
  final Uri endpoint;
  final String? bearerToken;
  final HttpClient _client;

  HttpTitanConversationTransport({
    required this.endpoint,
    this.bearerToken,
    HttpClient? client,
  }) : _client = client ?? HttpClient() {
    if (!endpoint.hasScheme || endpoint.host.isEmpty ||
        (endpoint.scheme != 'https' && endpoint.host != 'localhost')) {
      throw ArgumentError.value(endpoint, 'endpoint', 'https-workforce-endpoint-required');
    }
  }

  @override
  Future<Map<String, dynamic>> send(
    Map<String, dynamic> request, {
    Duration timeout = const Duration(seconds: 30),
  }) async {
    if (timeout <= Duration.zero) throw ArgumentError.value(timeout, 'timeout', 'positive-timeout-required');
    if (utf8.encode(jsonEncode(request)).length > 64 * 1024) {
      throw const FormatException('conversation-request-too-large');
    }
    final httpRequest = await _client.postUrl(endpoint).timeout(timeout);
    _headers(httpRequest);
    httpRequest.headers.contentType = ContentType.json;
    httpRequest.write(jsonEncode(request));
    final response = await httpRequest.close().timeout(timeout);
    return _decodeConversationResponse(response);
  }

  void _headers(HttpClientRequest request) {
    request.headers.set(HttpHeaders.acceptHeader, ContentType.json.mimeType);
    final token = bearerToken;
    if (token != null && token.isNotEmpty) request.headers.set(HttpHeaders.authorizationHeader, 'Bearer $token');
  }

  Future<Map<String, dynamic>> _decodeConversationResponse(HttpClientResponse response) async {
    final body = await _readSuccess(response, {200, 202});
    if (response.headers.contentType?.mimeType != ContentType.json.mimeType) {
      throw const FormatException('conversation-response-content-type-invalid');
    }
    final decoded = jsonDecode(body);
    if (decoded is! Map) throw const FormatException('conversation-response-object-required');
    return Map<String, dynamic>.from(decoded);
  }

  Future<String> _readSuccess(HttpClientResponse response, Set<int> statuses) async {
    final body = await utf8.decoder.bind(response).join();
    if (body.length > 256 * 1024) throw const FormatException('conversation-response-too-large');
    if (!statuses.contains(response.statusCode)) {
      if (response.statusCode == 401 || response.statusCode == 403) {
        throw StateError('conversation-authentication-required');
      }
      throw HttpException('titan-conversation-transport-${response.statusCode}');
    }
    return body;
  }
}

/// HTTP implementation of the canonical Surface SDK transport.
///
/// Endpoint paths are explicit runtime configuration rather than inferred in
/// the Flutter client, keeping Titan Core authoritative for routing.
class HttpTitanSurfaceTransport implements TitanSurfaceTransport {
  final Uri projectionEndpoint;
  final Uri commandEndpoint;
  final String? bearerToken;
  final HttpClient _client;

  HttpTitanSurfaceTransport({
    required this.projectionEndpoint,
    required this.commandEndpoint,
    this.bearerToken,
    HttpClient? client,
  }) : _client = client ?? HttpClient();

  @override
  Future<Map<String, dynamic>> getProjection({
    required String companyId,
    required String surface,
  }) async {
    final uri = projectionEndpoint.replace(queryParameters: {
      ...projectionEndpoint.queryParameters,
      'company_id': companyId,
      'surface': surface,
    });
    final request = await _client.getUrl(uri);
    _headers(request);
    final response = await request.close();
    return _decode(response, expected: 200);
  }

  @override
  Future<Map<String, dynamic>> submitCommand(Map<String, dynamic> intent) async {
    final request = await _client.postUrl(commandEndpoint);
    _headers(request);
    request.headers.contentType = ContentType.json;
    request.write(jsonEncode(intent));
    final response = await request.close();
    return _decode(response, expected: 200, alternateExpected: 202);
  }

  void _headers(HttpClientRequest request) {
    request.headers.set(HttpHeaders.acceptHeader, ContentType.json.mimeType);
    final token = bearerToken;
    if (token != null && token.isNotEmpty) {
      request.headers.set(HttpHeaders.authorizationHeader, 'Bearer $token');
    }
  }

  Future<Map<String, dynamic>> _decode(
    HttpClientResponse response, {
    required int expected,
    int? alternateExpected,
  }) async {
    final body = await utf8.decoder.bind(response).join();
    if (response.statusCode != expected &&
        response.statusCode != alternateExpected) {
      if (response.statusCode == 401 || response.statusCode == 403) {
        throw StateError('surface-authentication-required');
      }
      throw HttpException(
        'titan-surface-transport-${response.statusCode}',
        uri: response.redirects.isNotEmpty ? response.redirects.last.location : null,
      );
    }
    final decoded = jsonDecode(body);
    if (decoded is! Map) throw const FormatException('titan-surface-object-required');
    return Map<String, dynamic>.from(decoded);
  }
}
