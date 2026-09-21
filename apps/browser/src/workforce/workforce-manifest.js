(function(g){'use strict';
function build(managers){return {schema:'codee.ai-workforce.v1',version:'1.0.0',agents:managers.map(m=>({id:m.id,name:m.name,role:m.role,capabilities:m.capabilities,tools:m.tools,events:m.events,permissions:m.permissions,autonomy:m.autonomy,risk:m.risk,dependencies:m.dependencies})),globalAuthority:{planAdvance:false,directMutation:false},mutationPolicy:'request-host-action-with-verified-backup'};}
g.CodeeWorkforceManifest=Object.freeze({build});})(globalThis);
