import 'dart:convert';
import 'package:shared_preferences/shared_preferences.dart';
import '../models/titan_command.dart';

class OfflineCommandQueue {
  static const _key = 'titan_offline_command_queue_v1';

  Future<List<TitanCommand>> all() async {
    final prefs = await SharedPreferences.getInstance();
    final result = <TitanCommand>[];
    for (final raw in prefs.getStringList(_key) ?? const <String>[]) {
      try { result.add(TitanCommand.fromJson(Map<String,dynamic>.from(jsonDecode(raw)))); } catch (_) {}
    }
    return result;
  }

  Future<void> enqueue(TitanCommand command) async {
    final prefs = await SharedPreferences.getInstance();
    final rows = prefs.getStringList(_key) ?? <String>[];
    if (!rows.any((e) => e.contains('"id":"${command.id}"'))) rows.add(command.encode());
    await prefs.setStringList(_key, rows);
  }

  Future<void> remove(String id) async {
    final prefs = await SharedPreferences.getInstance();
    final rows = prefs.getStringList(_key) ?? <String>[];
    rows.removeWhere((e) => e.contains('"id":"$id"'));
    await prefs.setStringList(_key, rows);
  }
}
