(function attachMcpAdapter(global){
'use strict';
function create(host){
 global.CodeeHostCapabilities.validateMcpHost(host);
 const safeArgs=args=>args&&typeof args==='object'?args:{};
 return Object.freeze({
  implementsTransport:false,
  ownsMcpRuntime:false,
  listConnections:()=>host.listConnections(),
  discover:connectionId=>host.discover(connectionId),
  health:connectionId=>host.health(connectionId),
  callTool:(connectionId,name,args)=>host.callTool(connectionId,name,safeArgs(args)),
  readResource:(connectionId,uri)=>host.readResource(connectionId,uri),
  getPrompt:(connectionId,name,args)=>host.getPrompt(connectionId,name,safeArgs(args)),
  prepareToolMutation:typeof host.prepareToolMutation==='function'?((connectionId,name,args,tool)=>host.prepareToolMutation(connectionId,name,safeArgs(args),tool)):undefined,
  commitToolMutation:typeof host.commitToolMutation==='function'?((connectionId,ticketId)=>host.commitToolMutation(connectionId,ticketId)):undefined,
  createToolBackup:typeof host.createToolBackup==='function'?(request=>host.createToolBackup(request)):undefined,
  verifyToolBackup:typeof host.verifyToolBackup==='function'?((receipt,request)=>host.verifyToolBackup(receipt,request)):undefined,
  requestToolApproval:typeof host.requestToolApproval==='function'?(request=>host.requestToolApproval(request)):undefined,
  verifyToolMutation:typeof host.verifyToolMutation==='function'?(request=>host.verifyToolMutation(request)):undefined,
  auditToolMutation:typeof host.auditToolMutation==='function'?(request=>host.auditToolMutation(request)):undefined,
  verifyServerMutationBackup:typeof host.verifyServerMutationBackup==='function'?(request=>host.verifyServerMutationBackup(request)):undefined,
  listMutationReceipts:typeof host.listMutationReceipts==='function'?(()=>host.listMutationReceipts()):undefined,
  capabilityDescriptor:{
   transport:'host-owned',serverRegistration:'host-owned',oauth:'host-owned',planAdvance:false,
   serverVerifiedPrewriteBackup:host?.mutationGuarantees?.backupBeforeWrite==='server-enforced-verified-prewrite',
   twoPhaseMutationTickets:host?.mutationGuarantees?.twoPhaseTickets===true,
   preferredMutationFlow:host?.mutationGuarantees?.preferredFlow||null
  }
 });
}
global.CodeeMcpIntegrationAdapter=Object.freeze({create});
})(typeof globalThis!=='undefined'?globalThis:this);
