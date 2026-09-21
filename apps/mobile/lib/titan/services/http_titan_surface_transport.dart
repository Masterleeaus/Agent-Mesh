import 'dart:convert';
import 'dart:io';

import 'titan_gateway.dart';

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
