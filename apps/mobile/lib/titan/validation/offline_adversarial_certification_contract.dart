import '../models/offline_provenance_envelope.dart';
import '../models/titan_command.dart';
import '../services/offline_deterministic_replay_planner.dart';
import 'offline_provenance_contract.dart';
import 'offline_replay_contract.dart';

class OfflineAdversarialCertificationContract {
  static void certifyEnvelope(
    TitanOfflineProvenanceEnvelope envelope,{
    required String companyId,required String actorId,required String deviceId,
  }){
    OfflineProvenanceContract.validate(envelope);
    if(envelope.companyId!=companyId||envelope.actorId!=actorId||
       envelope.deviceId!=deviceId){
      throw StateError('offline certification scope mismatch');
    }
    if(envelope.authorityState!='offline_contracted'||
       envelope.approvalState!='revalidate_on_reconnect'){
      throw StateError('stale offline authority/approval rejected');
    }
  }

  static void certifyCommand(TitanCommand command){
    OfflineReplayContract.validate(command);
    if(command.authorityState!='offline_contracted'||
       !command.requiresServerRecheck){
      throw StateError('offline command authority is unsafe');
    }
  }

  static void certifyReplaySet(Iterable<TitanCommand> commands){
    final list=commands.toList();
    final ids=<String>{},idempotency=<String>{};
    for(final command in list){
      certifyCommand(command);
      if(!ids.add(command.id))throw StateError('duplicate command id');
      if(!idempotency.add(command.idempotencyKey))
        throw StateError('duplicate idempotency key');
    }
    final plan=const OfflineDeterministicReplayPlanner().plan(list);
    if(plan.blocked.isNotEmpty)
      throw StateError('replay set contains deterministic conflicts');
  }
}
