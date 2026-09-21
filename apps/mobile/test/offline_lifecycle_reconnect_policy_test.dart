import 'package:flutter_test/flutter_test.dart';
import 'package:titan_mobile/titan/services/offline_lifecycle_reconnect_policy.dart';
import 'package:titan_mobile/titan/services/background_refresh_coordinator.dart';
void main(){
 const policy=OfflineLifecycleReconnectPolicy();
 test('background lifecycle never grants consequential execution',(){
  final p=policy.plan(companyId:'c1',actorId:'a1',deviceId:'d1',
    trigger:'background_refresh',authenticatedReachability:true);
  expect(p.allowsBackgroundConsequentialExecution,false);
  expect(p.requiresServerAuthorityRevalidation,true);
  expect(TitanBackgroundRefreshCoordinator.allowsConsequentialExecution,false);
 });
 test('unauthenticated connectivity does not replay queued mutations',(){
  final p=policy.plan(companyId:'c1',actorId:'a1',deviceId:'d1',
    trigger:'connectivity_restored',authenticatedReachability:false);
  expect(p.replayQueuedMutations,false);
  expect(p.reconcileSignals,false);
 });
 test('resume with authenticated reachability can enter governed replay',(){
  final p=policy.plan(companyId:'c1',actorId:'a1',deviceId:'d1',
    trigger:'app_resume',authenticatedReachability:true);
  expect(p.replayQueuedMutations,true);
  expect(p.requiresServerAuthorityRevalidation,true);
 });
 test('scope and trigger fail closed',(){
  expect(()=>policy.plan(companyId:'',actorId:'a1',deviceId:'d1',
    trigger:'app_resume',authenticatedReachability:true),throwsStateError);
  expect(()=>policy.plan(companyId:'c1',actorId:'a1',deviceId:'d1',
    trigger:'silent_execute',authenticatedReachability:true),throwsStateError);
 });
}
