import '../models/titan_command.dart';
class OfflineQueueIntegrityService {
  const OfflineQueueIntegrityService();
  Map<String,String> audit(List<TitanCommand> commands){
    final issues=<String,String>{};
    final sequenceOwners=<int,String>{};
    final revisionByTarget=<String,int>{};
    for(final command in commands){
      final owner=sequenceOwners[command.queueSequence];
      if(owner!=null&&owner!=command.id){
        issues[command.id]='duplicate_queue_sequence';
      }else{
        sequenceOwners[command.queueSequence]=command.id;
      }
      final prior=revisionByTarget[command.conflictKey];
      if(prior!=null&&command.mutationRevision<=prior){
        issues[command.id]='non_monotonic_target_revision';
      }else{
        revisionByTarget[command.conflictKey]=command.mutationRevision;
      }
    }
    return issues;
  }
}
