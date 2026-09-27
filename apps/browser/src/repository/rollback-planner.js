(function attachRollbackPlanner(global){
'use strict';
function build(changeSet){const changes=[...(changeSet?.changes||[])].reverse();const actions=changes.map(c=>({path:c.path,action:c.operation==='create'?'delete':c.operation==='delete'?'restore':'restore',backupReceiptId:c.backupReceiptId||null,requiresCurrentStateBackup:true}));return {changeSetId:changeSet?.id||null,actions,canRollback:actions.length>0&&actions.every(a=>!!a.backupReceiptId),rule:'Capture and verify a fresh backup of current affected state before executing rollback.',mayAdvancePlan:false};}
global.CodeeRollbackPlanner=Object.freeze({build});
})(typeof globalThis!=='undefined'?globalThis:this);
