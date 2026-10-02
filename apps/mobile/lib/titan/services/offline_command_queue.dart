import 'dart:convert';
import 'package:shared_preferences/shared_preferences.dart';
import '../models/titan_command.dart';
import '../core/mobile_context_scope.dart';

class OfflineCommandQueue {
  static const _key = 'titan_offline_command_queue_v1';
  final MobileScopeKey? scope;
  const OfflineCommandQueue({this.scope});
  String get _storageKey => scope == null ? _key : '$_key/${scope!.storageKey}';

  Future<List<TitanCommand>> all() async {
    final prefs = await SharedPreferences.getInstance();
    final result = <TitanCommand>[];
    for (final raw in prefs.getStringList(_storageKey) ?? const <String>[]) {
      try { result.add(TitanCommand.fromJson(Map<String,dynamic>.from(jsonDecode(raw)))); } catch (_) {}
    }
    return result;
  }

  Future<int> count() async => (await all()).length;

  Future<void> enqueue(TitanCommand command) async {
    final queueScope = scope;
    if (queueScope != null && command.scope != queueScope) {
      throw StateError('offline-command-scope-mismatch');
    }
    final prefs = await SharedPreferences.getInstance();
    final rows = prefs.getStringList(_storageKey) ?? <String>[];
    if (!rows.any((e) => e.contains('"id":"${command.id}"'))) rows.add(command.encode());
    await prefs.setStringList(_storageKey, rows);
  }

  Future<TitanCommand> recordReplayAttempt(String id, DateTime at) async {
    final rows = await all();
    final command = rows.firstWhere((item) => item.id == id,
        orElse: () => throw StateError('offline-command-not-found'));
    final updated = command.recordReplayAttempt(at);
    await remove(id);
    await enqueue(updated);
    return updated;
  }

  Future<void> remove(String id) async {
    final prefs = await SharedPreferences.getInstance();
    final rows = prefs.getStringList(_storageKey) ?? <String>[];
    rows.removeWhere((e) => e.contains('"id":"${id}"'));
    await prefs.setStringList(_storageKey, rows);
  }
}

class ScopedOfflineCommandQueue extends OfflineCommandQueue {
  ScopedOfflineCommandQueue(MobileScopeKey scope) : super(scope: scope);

  Future<List<TitanCommand>> quarantineAll() async {
    final rows = await all();
    for (final command in rows) {
      await remove(command.id);
    }
    return rows;
  }
}
