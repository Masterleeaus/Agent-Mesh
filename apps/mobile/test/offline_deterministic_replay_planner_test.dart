import 'package:flutter_test/flutter_test.dart';
import 'package:titan_mobile/titan/models/titan_command.dart';
import 'package:titan_mobile/titan/models/titan_command_scope.dart';
import 'package:titan_mobile/titan/services/offline_deterministic_replay_planner.dart';

TitanCommand cmd(String id,int seq,int rev,{String idem='',String key='job:1'})=>
 TitanCommand(id:id,capability:'job.update',payload:{'job_id':'1'},
 createdAt:DateTime.utc(2026,1,1).add(Duration(seconds:seq)),
 scope:const TitanCommandScope(companyId:'c1',actorId:'a1',deviceId:'d1',surface:'go'),
 idempotencyKey:idem.isEmpty?'i$id':idem,queueSequence:seq,
 mutationRevision:rev,conflictKey:key,authorityState:'offline_contracted');

void main(){
 test('orders replay deterministically by sequence',(){
  final p=const OfflineDeterministicReplayPlanner().plan([cmd('b',2,2),cmd('a',1,1)]);
  expect(p.ready.map((e)=>e.id).toList(),['a','b']);
 });
 test('blocks duplicate idempotency and non monotonic revisions',(){
  final p=const OfflineDeterministicReplayPlanner().plan([
   cmd('a',1,1,idem:'same'),cmd('b',2,2,idem:'same'),cmd('c',3,1)]);
  expect(p.blocked['b'],'duplicate_idempotency_key');
  expect(p.blocked['c'],'non_monotonic_mutation_revision');
 });
 test('open conflict blocks target before transport',(){
  final p=const OfflineDeterministicReplayPlanner().plan(
    [cmd('a',1,1)],openConflictKeys:{'job:1'});
  expect(p.ready,isEmpty); expect(p.blocked['a'],'open_conflict');
 });
}
