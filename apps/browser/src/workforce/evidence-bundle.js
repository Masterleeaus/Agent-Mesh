(function(g){'use strict';
function create({managerId,items=[],runId=null,planId=null,stepId=null}={}){return Object.freeze({schema:'codee.evidence.v1',managerId,runId,planId,stepId,createdAt:new Date().toISOString(),items:items.map((x,i)=>({...x,id:x.id||`e${i+1}`})),authority:{mayAdvancePlan:false}});}
g.CodeeEvidenceBundle=Object.freeze({create});})(globalThis);
