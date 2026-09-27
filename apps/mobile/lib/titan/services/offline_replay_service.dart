import '../models/offline_conflict_record.dart';
import '../models/offline_replay_outcome.dart';
import '../models/offline_replay_receipt.dart';
import '../models/offline_replay_report.dart';
import '../models/titan_command.dart';
import '../validation/offline_replay_contract.dart';
import '../validation/offline_replay_outcome_contract.dart';
import 'offline_authority_service.dart';
import 'offline_command_queue.dart';
import 'offline_conflict_repository.dart';
import 'offline_replay_receipt_repository.dart';
import 'offline_replay_transport.dart';
import 'mobile_operation_journal.dart';
import 'offline_deterministic_replay_planner.dart';
import '../models/mobile_operation_journal_entry.dart';

class OfflineReplayService {
  final OfflineCommandQueue queue;
  final OfflineReplayReceiptRepository receiptRepository;
  final OfflineConflictRepository conflictRepository;
  final TitanOfflineReplayTransport transport;
  final OfflineAuthorityService authorityService;
  final TitanMobileOperationJournal? operationJournal;
  final OfflineDeterministicReplayPlanner replayPlanner;

  const OfflineReplayService({
    required this.queue,
    required this.receiptRepository,
    required this.conflictRepository,
    required this.transport,
    this.authorityService=const OfflineAuthorityService(),
    this.operationJournal,
    this.replayPlanner=const OfflineDeterministicReplayPlanner(),
  });

  Future<TitanOfflineReplayReport> replayPending() async{
    final now=DateTime.now();
    final replayId='replay-${now.microsecondsSinceEpoch}';
    final queuedCommands=await queue.all();
    final blockedKeys=(await conflictRepository.open())
        .map((item)=>item.command.conflictKey)
        .where((item)=>item.isNotEmpty).toSet();
    final deterministicPlan=replayPlanner.plan(
      queuedCommands,openConflictKeys:blockedKeys);
    final commands=deterministicPlan.ready;

    var attempted=0;
    var accepted=0;
    var conflicts=0;
    var rejected=0;
    var retryable=0;
    var blocked=deterministicPlan.blocked.length;
    var authenticationRequired=false;

    for(final queued in commands){
      if(blockedKeys.contains(queued.conflictKey)){
        blocked++;
        continue;
      }

      try{
        OfflineReplayContract.validate(queued);
      }catch(error){
        attempted++;
        conflicts++;
        blockedKeys.add(queued.conflictKey);
        await _recordConflict(
          queued,
          reason:'local_replay_contract_failed: $error');
        await queue.remove(queued.id);
        continue;
      }

      attempted++;
      final command=await queue.recordReplayAttempt(
        queued.id,DateTime.now());
      TitanReplayOutcome outcome;
      try{
        outcome=await transport.replay(command);
      }catch(error){
        outcome=TitanReplayOutcome(
          status:TitanReplayOutcomeStatus.retryable,
          reason:'transport_failure: $error');
      }

      try{
        OfflineReplayOutcomeContract.validate(command,outcome);
      }catch(error){
        outcome=TitanReplayOutcome(
          status:TitanReplayOutcomeStatus.retryable,
          reason:'invalid_server_replay_outcome: $error');
      }

      if(outcome.reason=='authentication_required'){
        authenticationRequired=true;
      }

      await _recordReceipt(command,outcome);
      await _recordOperationOutcome(command,outcome);

      switch(outcome.status){
        case TitanReplayOutcomeStatus.accepted:
          accepted++;
          await queue.remove(command.id);
          break;
        case TitanReplayOutcomeStatus.conflict:
          conflicts++;
          blockedKeys.add(command.conflictKey);
          await conflictRepository.add(
            TitanOfflineConflictRecord(
              conflictId:_conflictId(
                command,outcome.serverRevision),
              command:command,
              serverRevision:outcome.serverRevision,
              reason:outcome.reason.isEmpty
                  ? 'authoritative revision conflict'
                  : outcome.reason,
              createdAt:DateTime.now()));
          await queue.remove(command.id);
          break;
        case TitanReplayOutcomeStatus.rejected:
          rejected++;
          blockedKeys.add(command.conflictKey);
          await queue.remove(command.id);
          break;
        case TitanReplayOutcomeStatus.retryable:
          retryable++;
          blockedKeys.add(command.conflictKey);
          break;
      }
    }

    return TitanOfflineReplayReport(
      replayId:replayId,
      attempted:attempted,
      accepted:accepted,
      conflicts:conflicts,
      rejected:rejected,
      retryable:retryable,
      blocked:blocked,
      remaining:await queue.count(),
      authenticationRequired:authenticationRequired,
      completedAt:DateTime.now());
  }

  Future<void> _recordConflict(
    TitanCommand command, {
    required String reason,
  }) async{
    final outcome=TitanReplayOutcome(
      status:TitanReplayOutcomeStatus.conflict,
      reason:reason);
    await _recordReceipt(command,outcome);
    await conflictRepository.add(
      TitanOfflineConflictRecord(
        conflictId:_conflictId(command,null),
        command:command,
        reason:reason,
        createdAt:DateTime.now()));
  }


  Future<void> _recordOperationOutcome(
    TitanCommand command,
    TitanReplayOutcome outcome,
  ) async{
    final journal=operationJournal;
    if(journal==null)return;
    await journal.append(TitanMobileOperationJournalEntry(
      companyId:command.scope.companyId,
      actorId:command.scope.actorId,
      deviceId:command.scope.deviceId,
      surface:command.scope.surface,
      operationId:command.effectiveOperationId,
      requestId:command.effectiveRequestId,
      correlationId:command.effectiveCorrelationId,
      traceId:command.effectiveTraceId,
      capability:command.capability,
      stage:'execution',
      status:'server_${outcome.status.name}',
      metadata:{
        'command_id':command.id,
        if(outcome.serverReceiptRef!=null)
          'server_receipt_ref':outcome.serverReceiptRef,
        if(outcome.entityType!=null)'entity_type':outcome.entityType,
        if(outcome.entityId!=null)'entity_id':outcome.entityId,
        if(outcome.changeEventId!=null)
          'change_event_id':outcome.changeEventId,
        if(outcome.changeSequence!=null)
          'change_sequence':outcome.changeSequence,
        'signal_ids':outcome.signalIds,
        'projection_revisions':outcome.projectionRevisions,
        'authority_granted':false,
      },
      occurredAt:DateTime.now().toUtc(),
    ));
  }

  Future<void> _recordReceipt(
    TitanCommand command,
    TitanReplayOutcome outcome,
  )=>receiptRepository.add(
    TitanOfflineReplayReceipt(
      receiptId:
          'replay-${command.id}-${outcome.status.name}-${command.replayAttempts}',
      commandId:command.id,
      idempotencyKey:command.idempotencyKey,
      capability:command.capability,
      operationId:command.effectiveOperationId,
      requestId:command.effectiveRequestId,
      correlationId:command.effectiveCorrelationId,
      traceId:command.effectiveTraceId,
      queueSequence:command.queueSequence,
      mutationRevision:command.mutationRevision,
      basedOnRevision:command.basedOnRevision,
      serverRevision:outcome.serverRevision,
      result:outcome.status.name,
      authorityState:authorityService.outcomeAuthority(outcome),
      serverReceiptRef:outcome.serverReceiptRef,
      reason:outcome.reason,
      evidenceRefs:{
        ...command.evidenceRefs,
        ...outcome.evidenceRefs,
      }.toList()..sort(),
      entityType:outcome.entityType,
      entityId:outcome.entityId,
      changeEventId:outcome.changeEventId,
      changeSequence:outcome.changeSequence,
      signalIds:outcome.signalIds,
      projectionRevisions:outcome.projectionRevisions,
      attemptNumber:command.replayAttempts>0?command.replayAttempts:1,
      createdAt:DateTime.now()));

  String _conflictId(
    TitanCommand command,
    int? serverRevision,
  )=>'conflict-${command.id}-${serverRevision??0}';
}
