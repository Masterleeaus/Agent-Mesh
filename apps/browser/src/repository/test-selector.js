(function attachTestSelector(global){
'use strict';
const MAX_PHP_SYNTAX_COMMANDS=50;
function safeShellPath(path){return /^[A-Za-z0-9_./@+ -]+$/.test(path)&&!path.includes("'");}
function select(changedFiles,options){
 const files=(changedFiles||[]).filter(path=>global.CodeeRepositoryPolicy.isInScope(path)).map(global.CodeeRepositoryPolicy.normalize);
 const commands=[],reasons=[];
 const add=(cmd,why)=>{if(!commands.includes(cmd)){commands.push(cmd);reasons.push({command:cmd,reason:why});}};
 const phpFiles=files.filter(p=>p.endsWith('.php'));
 if(phpFiles.length){
  add('php artisan test','PHP/Laravel source changed');
  let count=0;
  for(const path of phpFiles){if(count>=MAX_PHP_SYNTAX_COMMANDS)break;if(!safeShellPath(path))continue;add(`php -l '${path}'`,'syntax-check changed PHP file');count++;}
 }
 if(files.some(p=>/(?:^|\/)database\/migrations\//.test(p))){add('php artisan migrate:status','migration changed');add('php artisan test','migration changes require regression coverage');}
 if(files.some(p=>/^routes\//.test(p)||/^app\/Extensions\/[^/]+\/routes\//i.test(p)))add('php artisan route:list','route definitions changed');
 if(files.some(p=>/\.(?:js|jsx|ts|tsx|vue)$/.test(p))){add('npm test -- --runInBand','frontend/JavaScript source changed');add('npm run build','frontend build verification');}
 if(files.some(p=>/composer\.(?:json|lock)$/.test(p))){add('composer validate','Composer metadata changed');add('composer audit','dependency security verification');}
 if(files.some(p=>/package(?:-lock)?\.json$|pnpm-lock\.yaml|yarn\.lock/.test(p)))add('npm audit','JavaScript dependency metadata changed');
 if(options?.includeGit)add('git diff --check','check whitespace/conflict markers');
 return {files,commands,reasons,truncatedPhpSyntax:phpFiles.filter(safeShellPath).length>MAX_PHP_SYNTAX_COMMANDS};
}
global.CodeeTestSelector=Object.freeze({select,MAX_PHP_SYNTAX_COMMANDS});
})(typeof globalThis!=='undefined'?globalThis:this);
