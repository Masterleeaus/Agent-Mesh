(function attachTitanZeroCommandCatalog(global){
 'use strict';
 const COMMANDS=Object.freeze([
  {id:'php-syntax',label:'PHP syntax check',command:"find app routes database/migrations -name '*.php' -print0 | xargs -0 -n1 php -l",mutating:false,requiresApproval:false,executionMode:'external_shell',domains:['quality','runtime']},
  {id:'artisan-about',label:'Laravel bootstrap/about',command:'php artisan about',mutating:false,requiresApproval:false,domains:['runtime','container']},
  {id:'artisan-route-list',label:'Laravel route list',command:'php artisan route:list',mutating:false,requiresApproval:false,domains:['routes','navigation']},
  {id:'artisan-migrate-status',label:'Migration status',command:'php artisan migrate:status',mutating:false,requiresApproval:false,domains:['database']},
  {id:'artisan-test',label:'Laravel test suite',command:'php artisan test',mutating:true,requiresApproval:true,executionClass:'EXECUTE',domains:['quality']},
  {id:'artisan-view-cache',label:'Compile Blade views',command:'php artisan view:cache',mutating:true,requiresApproval:true,domains:['frontend']},
  {id:'composer-validate',label:'Composer validation',command:'composer validate --no-check-publish',mutating:false,requiresApproval:false,domains:['build']},
  {id:'npm-build',label:'Production frontend build',command:'npm run build',mutating:true,requiresApproval:true,domains:['frontend','build']},
  {id:'artisan-config-show',label:'Inspect non-secret config key',command:'php artisan config:show <approved-key>',mutating:false,requiresApproval:true,executionMode:'manual_approved_read',domains:['runtime','config']},
  {id:'artisan-migrate',label:'Run database migrations',command:'php artisan migrate',mutating:true,requiresApproval:true,domains:['database']},
  {id:'artisan-migrate-rollback',label:'Rollback migration batch',command:'php artisan migrate:rollback',mutating:true,requiresApproval:true,domains:['database']},
  {id:'artisan-cache-clear',label:'Clear application cache',command:'php artisan cache:clear',mutating:true,requiresApproval:true,domains:['runtime']},
  {id:'artisan-config-clear',label:'Clear config cache',command:'php artisan config:clear',mutating:true,requiresApproval:true,domains:['runtime']},
  {id:'artisan-route-clear',label:'Clear route cache',command:'php artisan route:clear',mutating:true,requiresApproval:true,domains:['routes']},
  {id:'artisan-view-clear',label:'Clear compiled views',command:'php artisan view:clear',mutating:true,requiresApproval:true,domains:['frontend']}
 ]);
 function list(filter){return COMMANDS.filter(c=>!filter||(!filter.domain||c.domains.includes(filter.domain))&&(!filter.safeOnly||!c.mutating));}
 global.CodeeTitanZeroCommandCatalog=Object.freeze({COMMANDS,list});
})(typeof globalThis!=='undefined'?globalThis:this);
