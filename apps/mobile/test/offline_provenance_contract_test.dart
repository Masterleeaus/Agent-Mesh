import 'package:flutter_test/flutter_test.dart';
import 'package:titan_mobile/titan/models/offline_provenance_envelope.dart';
import 'package:titan_mobile/titan/services/offline_reconnect_gate.dart';
import 'package:titan_mobile/titan/validation/offline_provenance_contract.dart';
void main(){
  TitanOfflineProvenanceEnvelope env()=>const TitanOfflineProvenanceEnvelope(
    companyId:'c1',actorId:'a1',deviceId:'d1',agentId:'TZAG-X',
    capabilityId:'booking.manage',idempotencyKey:'idem-1',
    mutationRevision:2,basedOnRevision:1,
    originatingSignalIds:['sig-1'],evidenceRefs:['ev-1']);
  test('preserves required workforce and evidence provenance',(){
    final e=env(); OfflineProvenanceContract.validate(e);
    final j=e.toJson();
    for(final k in ['company_id','actor_id','device_id','agent_id','capability_id',
      'authority_state','approval_state','originating_signal_ids','evidence_refs'])
      expect(j.containsKey(k),true);
  });
  test('reconnect always revalidates authority through command bus',(){
    final ctx=const OfflineReconnectGate().prepare(env());
    expect(ctx['requires_server_authority_revalidation'],true);
    expect(ctx['requires_command_bus'],true);
    expect(ctx['emit_signal_only_after_acceptance'],true);
    expect(ctx['surface_authority_elevation'],false);
  });
  test('cross company actor or device replay fails closed',(){
    final gate=const OfflineReconnectGate();
    expect(()=>gate.assertSameScope(envelope:env(),companyId:'c2',actorId:'a1',deviceId:'d1'),throwsStateError);
    expect(()=>gate.assertSameScope(envelope:env(),companyId:'c1',actorId:'a2',deviceId:'d1'),throwsStateError);
    expect(()=>gate.assertSameScope(envelope:env(),companyId:'c1',actorId:'a1',deviceId:'d2'),throwsStateError);
  });
}
