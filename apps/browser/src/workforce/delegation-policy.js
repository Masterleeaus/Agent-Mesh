(function(g){'use strict';
const FORBIDDEN=new Set(['plan.advance','plan.complete','plan.skip']);
const MUTATION=/^(?:repository\.(?:host\.)?(?:write|delete|command)|server\.|database\.(?:write|update|delete|insert|command|execute)|git\.(?:write|commit|checkout|reset|merge|rebase))/i;
function authorize(req={}){const action=String(req.action||'').slice(0,240);if(FORBIDDEN.has(action))throw new Error('Forbidden: managers may not advance, complete, or skip plans');if(MUTATION.test(action))throw new Error('Host-owned mutation only: managers may request but never execute repository/server/database writes directly');return {allowed:true,action,authority:'advisory-or-read'};}
g.CodeeDelegationPolicy=Object.freeze({authorize,FORBIDDEN,MUTATION});})(globalThis);
