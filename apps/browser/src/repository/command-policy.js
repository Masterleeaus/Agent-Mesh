(function attachCommandPolicy(global){
'use strict';

const CLASSES=Object.freeze({INVALID:'INVALID',READ:'READ',VERIFY:'VERIFY',EXECUTE:'EXECUTE',WRITE:'WRITE',DESTRUCTIVE:'DESTRUCTIVE',UNKNOWN:'UNKNOWN'});
const SHELL_META=/[;&|`<>\r\n]/;
const DESTRUCTIVE=/\b(?:rm\s+-rf|del\s+\/s|rmdir\s+\/s|format\b|git\s+reset\s+--hard|git\s+clean\s+-[a-z]*f|git\s+push\b[^\r\n]*(?:--force(?:-with-lease)?|(?:^|\s)-f(?:\s|$))|artisan\s+(?:db:wipe|migrate:fresh|migrate:reset)|DROP\s+(?:TABLE|DATABASE))\b/i;
const READ_GIT_BRANCH=/^git\s+branch(?:\s+(?:--show-current|--list|-a|-r))?\s*$/i;
const READ=/^(?:php\s+artisan\s+(?:about|route:list|migrate:status)(?:\s|$)|composer\s+show(?:\s|$)|(?:npm|pnpm)\s+ls(?:\s|$)|git\s+(?:status|diff|log|show)(?:\s|$))/i;
const VERIFY=/^(?:php\s+-l(?:\s|$)|node\s+--check(?:\s|$)|composer\s+(?:validate|audit)(?:\s|$)|(?:npm|pnpm)\s+audit(?:\s|$))/i;
const EXECUTE=/^(?:php\s+artisan\s+test(?:\s|$)|(?:phpunit|pest|pytest)(?:\s|$)|(?:npm|pnpm|yarn)\s+(?:test|run)(?:\s|$))/i;
const WRITE=/\b(?:artisan\s+(?:migrate(?::rollback)?|db:seed|storage:link|config:(?:cache|clear)|route:(?:cache|clear)|view:(?:cache|clear)|cache:(?:clear|forget)|make:)|composer\s+(?:install|update|remove|require)|npm\s+(?:install|update|uninstall)|pnpm\s+(?:install|add|remove)|yarn\s+(?:install|add|remove)|git\s+(?:add|branch|commit|switch|checkout|merge|rebase|cherry-pick|tag|push))\b/i;
const MUTATING_READ_FLAGS=/(?:^(?:npm|pnpm)\s+audit\b.*(?:--fix\b|\bfix\b)|^git\s+(?:diff|show)\b.*?--output(?:=|\s))/i;
const TEST_MUTATING_FLAGS=/(?:--updateSnapshot\b|--update-snapshots?\b|(?:^|\s)-u(?:\s|$))/i;

function splitArgs(command){
 const out=[];let current='',quote='';let escaped=false;
 for(const ch of String(command||'')){
  if(escaped){current+=ch;escaped=false;continue;}
  if(ch==='\\'&&quote){escaped=true;continue;}
  if(quote){if(ch===quote)quote='';else current+=ch;continue;}
  if(ch==='"'||ch==="'"){quote=ch;continue;}
  if(/\s/.test(ch)){if(current){out.push(current);current='';}}else current+=ch;
 }
 if(current)out.push(current);return out;
}
function unsafePathArg(value){
 const raw=String(value||'').trim().replaceAll('\\','/');
 if(!raw||raw==='-'||raw.startsWith('-'))return false;
 if(raw.startsWith('/')||/^[A-Za-z]:\//.test(raw)||raw.split('/').includes('..'))return true;
 return global.CodeeRepositoryPolicy? !global.CodeeRepositoryPolicy.isInScope(raw):false;
}
function validatePathArguments(command){
 const text=String(command||'').trim();const args=splitArgs(text);
 if(/^php\s+-l\b/i.test(text)||/^node\s+--check\b/i.test(text)){
  const path=args[2];if(!path||unsafePathArg(path))return {ok:false,reason:'verification-path-outside-governed-scope'};
 }
 if(/^git\s+diff\b/i.test(text)&&args.includes('--no-index')){
  const idx=args.indexOf('--no-index');const paths=args.slice(idx+1).filter(x=>!x.startsWith('-'));
  if(paths.length<2||paths.some(unsafePathArg))return {ok:false,reason:'diff-path-outside-governed-scope'};
 }
 if(/^(?:phpunit|pest|pytest)(?:\s|$)/i.test(text)||/^php\s+artisan\s+test(?:\s|$)/i.test(text)){
  const pathish=args.filter((x,i)=>i>0&&!x.startsWith('-')&&(x.includes('/')||x.startsWith('.')));
  if(pathish.some(unsafePathArg))return {ok:false,reason:'test-path-outside-governed-scope'};
 }
 return {ok:true};
}
function effectManifest(command,scope){
 const text=String(command||'').trim();const targets=Array.isArray(scope?.targets)?scope.targets.slice():[];
 const out={filesystem:[],database:null,runtime:false,git:false,external:false,unknown:false,requiredBackups:[],complete:true};
 const add=(domain)=>{if(!out.requiredBackups.includes(domain))out.requiredBackups.push(domain);};
 if(/^php\s+artisan\s+migrate(?::rollback)?(?:\s|$)/i.test(text)){out.database={schema:true,rows:'possible'};add('database');}
 else if(/^php\s+artisan\s+db:seed(?:\s|$)/i.test(text)){out.database={schema:false,rows:true};add('database');}
 else if(/^php\s+artisan\s+(?:config:(?:cache|clear)|route:(?:cache|clear)|view:(?:cache|clear)|cache:(?:clear|forget))(?:\s|$)/i.test(text)){out.runtime=true;add('runtime');add('generated_state');}
 else if(/^php\s+artisan\s+(?:storage:link|make:)/i.test(text)){out.filesystem=targets.length?targets:['repository'];add('repository');add('filesystem');}
 else if(/^composer\s+(?:install|update|remove|require)(?:\s|$)/i.test(text)||/^(?:npm\s+(?:install|update|uninstall)|pnpm\s+(?:install|add|remove)|yarn\s+(?:install|add|remove))(?:\s|$)/i.test(text)){out.filesystem=targets.length?targets:['repository'];add('repository');add('generated_state');}
 else if(/^(?:npm|pnpm|yarn)\s+(?:test|run)(?:\s|$)|^php\s+artisan\s+test(?:\s|$)|^(?:phpunit|pest|pytest)(?:\s|$)/i.test(text)){out.filesystem=targets.length?targets:['repository'];out.database={schema:false,rows:'possible'};out.runtime=true;out.external=true;add('repository');add('database');add('runtime');add('external');}
 else if(/^git\s+(?:add|branch|commit|switch|checkout|merge|rebase|cherry-pick|tag|push)(?:\s|$)/i.test(text)){out.git=true;out.filesystem=targets.length?targets:['repository'];if(/^git\s+push\b/i.test(text)){out.external=true;add('git_remote');}add('git');add('repository');}
 else if(DESTRUCTIVE.test(text)){out.unknown=true;out.complete=false;}
 return Object.freeze({...out,requiredBackups:Object.freeze(out.requiredBackups.slice()),filesystem:Object.freeze(out.filesystem.slice())});
}
function result(cls,approval,backup,reason,command,scope){
 const effects=effectManifest(command,scope);return {class:cls,requiresApproval:approval,requiresBackup:backup,reason,effects};
}
function classify(command,scope){
 const text=String(command||'').trim();
 if(!text)return result(CLASSES.INVALID,true,false,'empty command',text,scope);
 if(SHELL_META.test(text))return result(CLASSES.DESTRUCTIVE,true,true,'shell chaining/redirection is not accepted by the safe command channel',text,scope);
 if(DESTRUCTIVE.test(text))return result(CLASSES.DESTRUCTIVE,true,true,'destructive command signature',text,scope);
 const pathValidation=validatePathArguments(text);if(!pathValidation.ok)return result(CLASSES.INVALID,true,false,pathValidation.reason,text,scope);
 if(MUTATING_READ_FLAGS.test(text))return result(CLASSES.WRITE,true,true,'read-family command contains a write/output flag',text,scope);
 if(EXECUTE.test(text)){if(TEST_MUTATING_FLAGS.test(text))return result(CLASSES.WRITE,true,true,'execution command contains an explicit update flag',text,scope);return result(CLASSES.EXECUTE,true,true,'command executes project/application code and may mutate state',text,scope);}
 if(VERIFY.test(text))return result(CLASSES.VERIFY,false,false,'recognized bounded verification command',text,scope);
 if(READ_GIT_BRANCH.test(text)||READ.test(text))return result(CLASSES.READ,false,false,'recognized read command',text,scope);
 if(WRITE.test(text))return result(CLASSES.WRITE,true,true,'command may modify repository/server/application state',text,scope);
 return result(CLASSES.UNKNOWN,true,false,'command is not in the deterministic catalogue',text,scope);
}
function envelope(command,scope){const classification=classify(command,scope);return {command:String(command||'').trim(),classification,effects:classification.effects,scope:scope||null,executionAllowed:false,requiredReceipts:classification.requiresBackup?['verified_backup','approval']:classification.requiresApproval?['approval']:[],mayAdvancePlan:false};}
global.CodeeCommandPolicy=Object.freeze({CLASSES,classify,envelope,effectManifest,validatePathArguments,splitArgs});
})(typeof globalThis!=='undefined'?globalThis:this);
