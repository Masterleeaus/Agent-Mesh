(function(g){'use strict';let seq=0;
function create({task,managerId,runId=null,planId=null,stepId=null,context={}}={}){seq++;return {schema:'codee.workorder.v1',id:`wo-${Date.now()}-${seq}`,task:String(task||''),managerId,runId,planId,stepId,status:'proposed',context,createdAt:new Date().toISOString(),authority:{mayAdvancePlan:false,directMutation:false}};}
g.CodeeWorkOrder=Object.freeze({create});})(globalThis);
