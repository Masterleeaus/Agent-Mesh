(function(g){'use strict';
const SCHEMA='titan-zero.manager.verification-plan.v1';
function freeze(v){if(!v||typeof v!=='object'||Object.isFrozen(v))return v;Object.freeze(v);for(const k of Object.keys(v))freeze(v[k]);return v;}
function plan(input={}){const event=String(input.event||'pass');const full=['packet_complete','rebase','convergence','promotion','security_boundary','schema_migration'].includes(event)||input.forceFull===true;return freeze({schema:SCHEMA,tier:full?'FULL':'IMPACT',event,run:full?['full_regression','all_syntax','all_json','security_scan','manifest_integrity']:['changed_module_tests','reverse_dependency_tests','changed_syntax','affected_schema_checks','targeted_security_rules'],full_required_before_promotion:true});}
g.TitanZeroManagerVerificationPlan=freeze({SCHEMA,plan});
})(typeof globalThis!=='undefined'?globalThis:this);
