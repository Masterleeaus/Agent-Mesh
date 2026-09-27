(function(g){'use strict';
function create({managerId,task,reason,preferredProvider='auto',contextRefs=[]}={}){return Object.freeze({schema:'codee.ai-assistance.v1',managerId,task:String(task||''),reason:String(reason||''),preferredProvider,contextRefs:[...contextRefs],mode:'advisory',authority:{executeResult:false,advancePlan:false},privacy:{includeSecrets:false,includeCredentials:false}});}
g.CodeeProviderAssistanceRequest=Object.freeze({create});})(globalThis);
