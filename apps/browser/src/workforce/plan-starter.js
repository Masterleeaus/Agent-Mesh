(function(g){'use strict';
function prepare({goal,evidence=[],constraints=[],managerIds=[]}={}){return Object.freeze({schema:'codee.plan-start.v1',goal:String(goal||''),evidence:[...evidence],constraints:[...constraints],managerIds:[...managerIds],requestedAction:'plan.create_draft',authority:{createOnly:true,advance:false,complete:false,skip:false}});}
g.CodeePlanStarter=Object.freeze({prepare});})(globalThis);
