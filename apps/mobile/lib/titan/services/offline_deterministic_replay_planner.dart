import '../models/titan_command.dart';
import '../validation/offline_replay_contract.dart';

class TitanOfflineReplayPlan {
  final List<TitanCommand> ready;
  final Map<String,String> blocked;
  const TitanOfflineReplayPlan({required this.ready,required this.blocked});
}

class OfflineDeterministicReplayPlanner {
  const OfflineDeterministicReplayPlanner();

  TitanOfflineReplayPlan plan(
    Iterable<TitanCommand> source, {
    Set<String> openConflictKeys=const {},
  }){
    final commands=source.toList()..sort(_compare);
    final ready=<TitanCommand>[];
    final blocked=<String,String>{};
    final seenIdempotency=<String>{};
    final latestRevision=<String,int>{};

    for(final command in commands){
      try{ OfflineReplayContract.validate(command); }
      catch(_){ blocked[command.id]='invalid_replay_contract'; continue; }

      if(!seenIdempotency.add(command.idempotencyKey)){
        blocked[command.id]='duplicate_idempotency_key'; continue;
      }
      if(openConflictKeys.contains(command.conflictKey)){
        blocked[command.id]='open_conflict'; continue;
      }

      final previous=latestRevision[command.conflictKey];
      if(previous!=null&&command.mutationRevision<=previous){
        blocked[command.id]='non_monotonic_mutation_revision'; continue;
      }
      if(command.basedOnRevision!=null&&
         command.basedOnRevision!>=command.mutationRevision){
        blocked[command.id]='invalid_revision_dependency'; continue;
      }

      latestRevision[command.conflictKey]=command.mutationRevision;
      ready.add(command);
    }
    return TitanOfflineReplayPlan(ready:ready,blocked:blocked);
  }

  int _compare(TitanCommand a,TitanCommand b){
    final sequence=a.queueSequence.compareTo(b.queueSequence);
    if(sequence!=0)return sequence;
    final created=a.createdAt.compareTo(b.createdAt);
    if(created!=0)return created;
    return a.id.compareTo(b.id);
  }
}
