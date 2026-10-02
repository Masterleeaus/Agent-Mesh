import 'dart:convert';

import 'package:cryptography/cryptography.dart';
import 'package:flutter/services.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';

/// Platform-backed secret storage. Only a missing plugin falls back to
/// process memory; platform storage failures remain visible to the caller.
class TitanSecureStore {
  static final Map<String, String> _memory = <String, String>{};
  final FlutterSecureStorage storage;

  const TitanSecureStore({
    this.storage = const FlutterSecureStorage(
      aOptions: AndroidOptions(encryptedSharedPreferences: true),
      iOptions: IOSOptions(
        accessibility: KeychainAccessibility.first_unlock_this_device,
      ),
    ),
  });

  Future<String?> read(String logicalKey) async {
    final key = await _physicalKey(logicalKey);
    try {
      return await storage.read(key: key);
    } on MissingPluginException {
      return _memory[key];
    }
  }

  Future<void> write(String logicalKey, String value) async {
    final key = await _physicalKey(logicalKey);
    try {
      await storage.write(key: key, value: value);
    } on MissingPluginException {
      _memory[key] = value;
    }
  }

  Future<void> delete(String logicalKey) async {
    final key = await _physicalKey(logicalKey);
    try {
      await storage.delete(key: key);
    } on MissingPluginException {
      _memory.remove(key);
    }
  }

  Future<String> _physicalKey(String logicalKey) async {
    final digest = await Sha256().hash(utf8.encode(logicalKey));
    return 'titan_secure_${digest.bytes.map((b) => b.toRadixString(16).padLeft(2, '0')).join()}';
  }
}
