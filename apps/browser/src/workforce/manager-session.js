(function(g){'use strict';let seq=0;
function create({managerId,task,runId=null,planId=null,stepId=null}={}){seq++;return {schema:'codee.manager-session.v1',id:`ms-${Date.now()}-${seq}`,managerId,task,status:'open',runId,planId,stepId,evidence:[],requests:[],recommendations:[],authority:{advancePlan:false,directMutation:false}};}
function addEvidence(session,item){if(session.status!=='open')throw new Error('Manager session is closed');session.evidence.push(item);return session;}
function addRequest(session,request){if(session.status!=='open')throw new Error('Manager session is closed');session.requests.push(request);return session;}
function close(session,recommendation=null){if(recommendation)session.recommendations.push(recommendation);session.status='closed';session.closedAt=new Date().toISOString();return session;}
g.CodeeManagerSession=Object.freeze({create,addEvidence,addRequest,close});})(globalThis);
