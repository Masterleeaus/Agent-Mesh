(function attachTitanZeroRiskRules(global){
 'use strict';
 const RULES=Object.freeze([
  {code:'CRITICAL_MIGRATION_RISK',severity:'critical',test:r=>(r.migrations?.risks||[]).some(x=>x.severity==='critical'),message:'At least one critical migration risk is present.'},
  {code:'MIXED_TENANCY_BOUNDARY',severity:'high',test:r=>!!r.tenancy?.mixedBoundary,message:'Core schema contains both tenant_company_id and company_id ownership signals.'},
  {code:'UNCONSTRAINED_TENANCY_SIGNAL',severity:'medium',test:r=>(r.tenancy?.unconstrainedSignals||[]).length>0,message:'Code contains ownership-column signals without an obvious local query constraint; inspect manually.'},
  {code:'MODEL_SCHEMA_DRIFT',severity:'high',test:r=>(r.modelSchema?.findings||[]).length>0,message:'Eloquent model/schema drift findings are present.'},
  {code:'NAVIGATION_DRIFT',severity:'medium',test:r=>(r.navigation?.brokenParents?.length||0)+(r.navigation?.missingRoutes?.length||0)+(r.navigation?.missingPermissions?.length||0)+(r.navigation?.duplicateRoutes?.length||0)+(r.navigation?.duplicateIds?.length||0)+(r.navigation?.cycles?.length||0)>0,message:'Navigation metadata does not fully resolve against routes/permissions or contains duplicate/cyclic structure.'},
  {code:'ROUTE_NAME_COLLISION',severity:'high',test:r=>(r.routes?.duplicateNames||[]).length>0,message:'Duplicate named routes were detected.'},
  {code:'SENSITIVE_CONFIG_SURFACE',severity:'medium',test:r=>(r.config?.sensitiveEnvKeys||[]).length>0,message:'Sensitive environment-variable names are referenced; ensure values never enter AI context or artifacts.'},
  {code:'MISSING_MODEL_TABLE',severity:'high',test:r=>(r.modelSchema?.missingTables||[]).length>0,message:'One or more core models map to tables absent from the supplied schema snapshot.'}
 ]);
 function evaluate(report){return RULES.filter(rule=>{try{return rule.test(report||{});}catch{return false;}}).map(({test,...rest})=>rest);}
 global.CodeeTitanZeroRiskRules=Object.freeze({RULES,evaluate});
})(typeof globalThis!=='undefined'?globalThis:this);
