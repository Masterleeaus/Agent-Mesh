(function attachTitanZeroErrorClassifier(global){
 'use strict';
 const CATEGORIES=Object.freeze([
  {category:'container',re:/BindingResolutionException|Target \[[^\]]+\] is not instantiable|Unresolvable dependency/i,profile:'tz-runtime-debugger',checks:['service providers','container bindings','constructor dependencies']},
  {category:'database',re:/SQLSTATE|QueryException|Unknown column|Base table or view not found|Integrity constraint/i,profile:'tz-database-engineer',checks:['schema graph','migration state','model/query assumptions']},
  {category:'migration',re:/migrat|Duplicate column|Duplicate key name|Identifier name .* too long|Invalid default value/i,profile:'tz-migration-engineer',checks:['migration safety','schema snapshot','restartability']},
  {category:'routing',re:/Route \[[^\]]+\] not defined|Action .* not defined|MethodNotAllowedHttpException|NotFoundHttpException/i,profile:'tz-navigation-engineer',checks:['route map','controller action','navigation consumers']},
  {category:'view',re:/View \[[^\]]+\] not found|Blade|Undefined variable.*view|Livewire/i,profile:'tz-frontend-engineer',checks:['view families','Livewire component','Blade compile']},
  {category:'filesystem',re:/Permission denied|Failed to open stream|No such file or directory/i,profile:'tz-runtime-debugger',checks:['path ownership','deployment artifact','storage/cache paths']},
  {category:'authentication',re:/Unauthenticated|AuthorizationException|403 Forbidden|CSRF token mismatch/i,profile:'tz-security-auditor',checks:['middleware','policy/permission','session/CSRF']}
 ]);
 function classify(message){const text=String(message||'');for(const c of CATEGORIES){if(c.re.test(text))return {category:c.category,suggestedProfile:c.profile,checks:c.checks,confidence:'high'};}return {category:'unknown',suggestedProfile:'tz-runtime-debugger',checks:['full stack trace','recent changes','route/runtime context'],confidence:'low'};}
 global.CodeeTitanZeroErrorClassifier=Object.freeze({CATEGORIES,classify});
})(typeof globalThis!=='undefined'?globalThis:this);
