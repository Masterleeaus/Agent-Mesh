(function(g){'use strict';
function build(input,repositoryAnalysis=null,mcpContext=null){const route=g.CodeeManagerRouter.route(input);return {task:input,managerRoute:route,repositoryAnalysis,mcpContext,requestedCapabilities:g.CodeeContextStrategy.select(route.classification.tags),authority:{advancePlan:false}};}
g.CodeeWorkforceContextBridge=Object.freeze({build});})(globalThis);
