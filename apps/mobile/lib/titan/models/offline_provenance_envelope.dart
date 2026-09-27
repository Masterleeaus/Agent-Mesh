class TitanOfflineProvenanceEnvelope {
  final String companyId,actorId,deviceId,agentId,capabilityId;
  final String authorityState,approvalState,idempotencyKey;
  final List<String> originatingSignalIds,evidenceRefs;
  final int mutationRevision;
  final int? basedOnRevision;
  const TitanOfflineProvenanceEnvelope({
    required this.companyId,required this.actorId,required this.deviceId,
    required this.agentId,required this.capabilityId,
    required this.idempotencyKey,required this.mutationRevision,
    this.basedOnRevision,this.authorityState='offline_contracted',
    this.approvalState='revalidate_on_reconnect',
    this.originatingSignalIds=const [],this.evidenceRefs=const [],
  });
  Map<String,dynamic> toJson()=>{
    'company_id':companyId,'actor_id':actorId,'device_id':deviceId,
    'agent_id':agentId,'capability_id':capabilityId,
    'authority_state':authorityState,'approval_state':approvalState,
    'idempotency_key':idempotencyKey,'mutation_revision':mutationRevision,
    if(basedOnRevision!=null)'based_on_revision':basedOnRevision,
    'originating_signal_ids':originatingSignalIds,'evidence_refs':evidenceRefs,
  };
}
