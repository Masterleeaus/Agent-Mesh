import '../models/offline_reconciliation_snapshot.dart';
import '../models/offline_replay_report.dart';
import '../models/server_signal_reconciliation_report.dart';
import 'offline_reconciliation_service.dart';
import 'offline_replay_service.dart';
import 'server_signal_reconciliation_service.dart';
import '../models/offline_lifecycle_reconnect_plan.dart';

class TitanReconnectResult {
  final TitanOfflineReplayReport replay;
  final TitanOfflineReconciliationSnapshot reconciliation;
  final TitanServerSignalReconciliationReport? signals;

  const TitanReconnectResult({
    required this.replay,
    required this.reconciliation,
    this.signals,
  });
}

abstract class TitanReconnectCoordinator {
  Future<TitanReconnectResult> reconcile();
}

class ReconnectReconciliationService
    implements TitanReconnectCoordinator {
  final OfflineReplayService replayService;
  final OfflineReconciliationService reconciliationService;
  final ServerSignalReconciliationService? signalService;

  const ReconnectReconciliationService({
    required this.replayService,
    required this.reconciliationService,
    this.signalService,
  });

  /// Called only after authenticated server reachability is verified.
  /// Outbound queued mutations reconcile first. Then inbound Signals are
  /// pulled into the encrypted Signal inbox / projection-refresh hints.
  @override
  Future<TitanReconnectResult> reconcile() async{
    final replay=await replayService.replayPending();
    TitanServerSignalReconciliationReport? signals;
    if(!replay.authenticationRequired&&signalService!=null){
      signals=await signalService!.reconcile();
    }
    final reconciliation=await reconciliationService.snapshot();
    return TitanReconnectResult(
      replay:replay,
      reconciliation:reconciliation,
      signals:signals,
    );
  }
  Future<TitanReconnectResult> reconcileFromLifecycle(
    TitanOfflineLifecycleReconnectPlan plan,
  ) async{
    if(!plan.requiresAuthenticatedReachability||
       !plan.requiresServerAuthorityRevalidation||
       plan.allowsBackgroundConsequentialExecution){
      throw StateError('unsafe lifecycle reconnect plan');
    }
    if(!plan.replayQueuedMutations){
      final reconciliation=await reconciliationService.snapshot();
      return TitanReconnectResult(
        replay:TitanOfflineReplayReport(
          replayId:'reconnect-deferred',attempted:0,accepted:0,conflicts:0,
          rejected:0,retryable:0,blocked:0,
          remaining:reconciliation.queued,authenticationRequired:true,
          completedAt:DateTime.now()),
        reconciliation:reconciliation,
      );
    }
    return reconcile();
  }

}
