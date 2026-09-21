import '../core/titan_session.dart';
import '../models/generative_item.dart';
import '../models/titan_command.dart';
import '../generative/demo_engine.dart';
import 'offline_command_queue.dart';

abstract class TitanGateway {
  Future<List<TitanGenerativeItem>> converse(String message);
  Future<void> command(String capability, Map<String,dynamic> payload, {bool onlineRequired = false});
}

class LocalMvpTitanGateway implements TitanGateway {
  final TitanSession session;
  final OfflineCommandQueue queue;
  LocalMvpTitanGateway(this.session, this.queue);

  @override Future<List<TitanGenerativeItem>> converse(String message) async => demoGenerativeResponse(message);

  @override Future<void> command(String capability, Map<String,dynamic> payload, {bool onlineRequired = false}) async {
    if (onlineRequired) throw StateError('$capability requires the Titan server');
    final now = DateTime.now();
    await queue.enqueue(TitanCommand(
      id: '${session.deviceId}-${now.microsecondsSinceEpoch}', capability: capability,
      payload: {...session.toJson(), ...payload}, createdAt: now,
    ));
  }
}
