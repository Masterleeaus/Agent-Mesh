(function attachTitanZeroReceiverAdapter(global){
 'use strict';
 const REQUIRED=['registerContextProvider','registerPrompts','registerSkills','registerProfiles','registerDiagnosticsSection','registerSettingsSection'];
 function register(host,options){
  const target=host||{}; const missing=REQUIRED.filter(name=>typeof target[name]!=='function');
  if(missing.length) throw new Error(`Titan Zero receiver registration APIs missing: ${missing.join(', ')}`);
  const descriptor=global.CodeeTitanZeroDeveloperPack.registrationDescriptor();
  const settings=Object.assign({},descriptor.settings,options?.settings||{});
  target.registerContextProvider({id:'titan-zero-runner-context',surface:'runner',priority:50,provide:(snapshot)=>global.CodeeTitanZeroDeveloperPack.analyzeSnapshot(snapshot,settings).context});
  target.registerContextProvider({id:'titan-zero-plan-preflight',surface:'multi_step_plans',priority:50,provide:(snapshot)=>global.CodeeTitanZeroDeveloperPack.analyzeSnapshot(snapshot,settings).context});
  target.registerPrompts(descriptor.prompts);
  target.registerSkills(descriptor.skills);
  target.registerProfiles(descriptor.profiles);
  target.registerDiagnosticsSection({id:'titan-zero-developer-intelligence',title:'Titan Zero',build:(snapshot)=>global.CodeeTitanZeroDeveloperPack.analyzeSnapshot(snapshot,settings).runtimeDiagnostics});
  target.registerSettingsSection({id:'titan-zero-developer-intelligence',title:'Titan Zero',defaults:settings,fields:[
   {key:'enabled',type:'boolean',label:'Enable Titan Zero developer intelligence'},
   {key:'autoDetect',type:'boolean',label:'Auto-detect Titan Zero projects'},
   {key:'analyzeSqlSchema',type:'boolean',label:'Analyze supplied SQL DDL/schema'},
   {key:'analyzeMigrations',type:'boolean',label:'Analyze core migrations'},
   {key:'analyzeTenancy',type:'boolean',label:'Analyze tenancy/ownership signals'},
   {key:'analyzeNavigationMetadata',type:'boolean',label:'Analyze explicitly supplied navigation metadata'},
   {key:'analyzeFrontend',type:'boolean',label:'Analyze Blade/Livewire/React/Alpine/Vite/Tailwind surfaces'},
   {key:'maxContextChars',type:'number',min:4000,max:50000,label:'Maximum Titan Zero context characters'},
   {key:'includeExtensions',type:'boolean',locked:true,value:true,label:'Include app/Extensions/** in Titan Zero intelligence'},
   {key:'parseSqlRows',type:'boolean',locked:true,value:false,label:'Do not parse arbitrary SQL row values'}
  ]});
  return {registered:true,createdTopLevelTabs:0,surfaces:['runner','multi_step_plans','prompts','skills','settings','diagnostics'],authority:{planAdvance:false,repositoryMutation:false,commandExecution:false,extensionInspection:true}};
 }
 global.CodeeTitanZeroReceiverAdapter=Object.freeze({register,REQUIRED});
})(typeof globalThis!=='undefined'?globalThis:this);
