import 'package:flutter_test/flutter_test.dart';
import 'package:titan_mobile/titan/models/offline_provenance_envelope.dart';
import 'package:titan_mobile/titan/models/titan_command.dart';
import 'package:titan_mobile/titan/models/titan_command_scope.dart';
import 'package:titan_mobile/titan/validation/offline_adversarial_certification_contract.dart';

TitanCommand command(String id,int seq,int revision,{String idem=''})=>TitanCommand(
 id:id,capability:'job.update',payload:{'job_id':'1'},
 createdAt:DateTime.utc(2026,9,21).add(Duration(seconds:seq)),
 scope:const TitanCommandScope(companyId:'c1',actorId:'a1',deviceId:'d1',surface:'go'),
 idempotencyKey:idem.isEmpty?'idem-$id':idem,queueSequence:seq,
 mutationRevision:revision,conflictKey:'job:1',requiresServerRecheck:true,
 authorityState:'offline_contracted');

void main(){
 test('cross company actor and device envelopes fail closed',(){
  const e=TitanOfflineProvenanceEnvelope(companyId:'c1',actorId:'a1',deviceId:'d1',
   agentId:'TZAG-OPS',capabilityId:'job.update',idempotencyKey:'i1',mutationRevision:1);
  for(final scope in [('c2','a1','d1'),('c1','a2','d1'),('c1','a1','d2')]){
   expect(()=>OfflineAdversarialCertificationContract.certifyEnvelope(e,
    companyId:scope.$1,actorId:scope.$2,deviceId:scope.$3),throwsStateError);
  }
 });
 test('stale elevated authority fails closed',(){
  const e=TitanOfflineProvenanceEnvelope(companyId:'c1',actorId:'a1',deviceId:'d1',
   agentId:'TZAG-OPS',capabilityId:'job.update',idempotencyKey:'i1',
   mutationRevision:1,authorityState:'trusted_auto');
  expect(()=>OfflineAdversarialCertificationContract.certifyEnvelope(e,
   companyId:'c1',actorId:'a1',deviceId:'d1'),throwsStateError);
 });
 test('duplicate idempotency replay fails closed',(){
  expect(()=>OfflineAdversarialCertificationContract.certifyReplaySet([
   command('a',1,1,idem:'same'),command('b',2,2,idem:'same')]),throwsStateError);
 });
 test('deterministic valid replay set certifies',(){
  OfflineAdversarialCertificationContract.certifyReplaySet([
   command('a',1,1),command('b',2,2)]);
 });
}
