(function(g){'use strict';
const SCHEMA='titan-zero.manager.verification-plan.v2';
function freeze(v){if(!v||typeof v!=='object'||Object.isFrozen(v))return v;Object.freeze(v);for(const k of Object.keys(v))freeze(v[k]);return v;}
function plan(input={}){const event=String(input.event||'pass');const full=['packet_complete','rebase','integration','github-merge','security_boundary','schema_migration'].includes(event)||input.forceFull===true;return freeze({schema:SCHEMA,tier:full?'FULL':'IMPACT',event,run:full?['full_regression','all_syntax','all_json','security_scan','manifest_integrity']:['changed_module_tests','reverse_dependency_tests','changed_syntax','affected_schema_checks','targeted_security_rules'],fullRequiredBeforeGitHubMerge:true});}
g.TitanZeroManagerVerificationPlan=freeze({SCHEMA,plan});
})(typeof globalThis!=='undefined'?globalThis:this);
