(function(g){'use strict';let seq=0;
function create({managerId,capability,args={},runId=null,planId=null,stepId=null,reason=''}={}){g.CodeeDelegationPolicy.authorize({action:capability});seq++;return Object.freeze({schema:'codee.manager-tool-request.v1',id:`mtr-${Date.now()}-${seq}`,managerId,capability,args,reason,runId,planId,stepId,authority:{execute:false,advancePlan:false},requestedAt:new Date().toISOString()});}
g.CodeeManagerToolRequest=Object.freeze({create});})(globalThis);
