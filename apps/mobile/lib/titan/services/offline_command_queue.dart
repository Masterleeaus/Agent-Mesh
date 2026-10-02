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

  String get _quarantineKey => '${_storageKey}/quarantine';

  Future<List<TitanCommand>> quarantined() async {
    final prefs = await SharedPreferences.getInstance();
    final result = <TitanCommand>[];
    for (final raw in prefs.getStringList(_quarantineKey) ?? const <String>[]) {
      try {
        result.add(TitanCommand.fromJson(Map<String, dynamic>.from(jsonDecode(raw))));
      } catch (_) {
        // Invalid quarantined records remain isolated and are never replayed.
      }
    }
    return result;
  }

  Future<List<TitanCommand>> quarantineAll() async {
    final rows = await all();
    final prefs = await SharedPreferences.getInstance();
    final stored = prefs.getStringList(_quarantineKey) ?? <String>[];
    final existingIds = <String>{};
    for (final raw in stored) {
      try {
        existingIds.add(
          TitanCommand.fromJson(Map<String, dynamic>.from(jsonDecode(raw))).id,
        );
      } catch (_) {
        // Preserve malformed records without making them replayable.
      }
    }
    for (final command in rows) {
      if (existingIds.add(command.id)) stored.add(command.encode());
    }
    // Persist quarantine before removing anything from the active queue.
    await prefs.setStringList(_quarantineKey, stored);
    for (final command in rows) {
      await remove(command.id);
    }
    return rows;
  }

  /// Re-enable quarantined work only after the caller has independently
  /// revalidated the original scope with server authority. A new company or
  /// surface can never adopt the old intents.
  Future<List<TitanCommand>> restoreQuarantinedAfterRevalidation({
    required MobileScopeKey validatedScope,
  }) async {
    final queueScope = scope;
    if (queueScope == null || validatedScope != queueScope) {
      throw StateError('offline-quarantine-scope-revalidation-mismatch');
    }
    final rows = await quarantined();
    final eligible = rows.where((command) => command.scope == validatedScope).toList();
    for (final command in eligible) {
      await enqueue(command);
    }
    final prefs = await SharedPreferences.getInstance();
    final eligibleIds = eligible.map((command) => command.id).toSet();
    final retained = (prefs.getStringList(_quarantineKey) ?? const <String>[])
        .where((raw) {
          try {
            return !eligibleIds.contains(
              TitanCommand.fromJson(Map<String, dynamic>.from(jsonDecode(raw))).id,
            );
          } catch (_) {
            return true;
          }
        })
        .toList(growable: false);
    await prefs.setStringList(_quarantineKey, retained);
    return eligible;
  }
}
