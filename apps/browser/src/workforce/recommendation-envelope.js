(function(g){'use strict';
function create({managerId,summary,actions=[],evidenceIds=[],risk='low',needsAI=false}={}){return Object.freeze({schema:'codee.recommendation.v1',managerId,summary:String(summary||''),actions:[...actions],evidenceIds:[...evidenceIds],risk,needsAI,authority:{execute:false,advancePlan:false}});}
g.CodeeRecommendationEnvelope=Object.freeze({create});})(globalThis);
