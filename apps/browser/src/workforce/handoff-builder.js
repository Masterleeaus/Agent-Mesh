(function(g){'use strict';
function build({from,to,task,evidence,notes=[]}={}){return Object.freeze({schema:'codee.manager-handoff.v1',from,to,task:String(task||''),evidence,notes:[...notes],requiredEvidence:(evidence?.items||[]).map(x=>x.id),authority:{mayAdvancePlan:false,directMutation:false}});}
g.CodeeHandoffBuilder=Object.freeze({build});})(globalThis);
