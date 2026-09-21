(function(g){'use strict';
function create({managerId,changedFiles=[],commands=[],claims=[],runId=null,planId=null,stepId=null}={}){return Object.freeze({schema:'codee.verification-request.v1',managerId,changedFiles:[...changedFiles],commands:[...commands],claims:[...claims],runId,planId,stepId,authority:{markStepComplete:false,advancePlan:false},evidenceRequired:true});}
g.CodeeVerificationRequest=Object.freeze({create});})(globalThis);
