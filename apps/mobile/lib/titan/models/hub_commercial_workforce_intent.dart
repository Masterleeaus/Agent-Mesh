class HubCommercialWorkforceIntent {
  final String companyId;
  final String customerId;
  final String agentId;
  final String capability;
  final String intentType;
  final String resourceId;
  final int? resourceRevision;
  final String requestId;
  const HubCommercialWorkforceIntent({
    required this.companyId,required this.customerId,required this.agentId,
    required this.capability,required this.intentType,required this.resourceId,
    required this.requestId,this.resourceRevision,
  });

  Map<String,dynamic> toCommandContext()=>{
    'company_id':companyId,'customer_id':customerId,'agent_id':agentId,
    'capability':capability,'intent_type':intentType,'resource_id':resourceId,
    if(resourceRevision!=null)'resource_revision':resourceRevision,
    'request_id':requestId,'surface':'hub',
    'authority_granted':false,'requires_command_bus':true,
    'requires_server_revalidation':true,
  };
}
