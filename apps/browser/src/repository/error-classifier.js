(function attachErrorClassifier(global){
'use strict';
const RULES=[
 ['LARAVEL_BINDING',/Target class .* does not exist|BindingResolutionException/i,'service-container'],
 ['MISSING_FILE',/Failed to open stream|No such file or directory|require\(.+\):/i,'filesystem'],
 ['DATABASE_CONSTRAINT',/SQLSTATE\[[^\]]+\].*(?:constraint|integrity|foreign key|duplicate)/i,'database'],
 ['DATABASE_SCHEMA',/Unknown column|Base table or view not found|doesn.t exist/i,'database'],
 ['AUTHORIZATION',/403|Unauthorized|AuthenticationException|AuthorizationException/i,'auth'],
 ['ROUTE',/Route \[.+\] not defined|NotFoundHttpException|405 Method Not Allowed/i,'routes'],
 ['PHP_TYPE',/TypeError|must be of type|Return value must be/i,'php'],
 ['FRONTEND_BUILD',/Module not found|Failed to resolve import|Vite|webpack/i,'frontend'],
 ['MEMORY',/Allowed memory size .* exhausted|JavaScript heap out of memory/i,'runtime']
];
function classify(input){const text=String(input||'');const summary=()=>{const line=text.split(/\r?\n/)[0].slice(0,500);return global.CodeeRepositoryPolicy?.redactText?global.CodeeRepositoryPolicy.redactText(line):line;};for(const [code,rx,area] of RULES)if(rx.test(text))return {code,area,confidence:0.9,summary:summary()};return {code:'UNKNOWN',area:'unknown',confidence:0.2,summary:summary()};}
global.CodeeErrorClassifier=Object.freeze({classify,RULES:RULES.map(([code,,area])=>({code,area}))});
})(typeof globalThis!=='undefined'?globalThis:this);
