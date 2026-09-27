(function attachTitanCodePersonalWorkforce(global){
'use strict';
const WORKERS=Object.freeze([
 {id:'personal-coding-architect',name:'Coding & Architecture',domain:'coding',skills:['architecture','typescript','javascript','php','sql','debugging','integration','refactoring']},
 {id:'personal-repository-auditor',name:'Repository Auditor',domain:'audit',skills:['repository-audit','dependency-analysis','dead-code','duplication','configuration','git','evidence']},
 {id:'personal-security-qa',name:'Security & QA',domain:'assurance',skills:['security-review','privacy','threat-model','testing','verification','release-readiness']},
 {id:'personal-environmental-scientist',name:'Environmental Scientist',domain:'environment',skills:['environmental-chemistry','contamination','sampling','fate-transport','risk-assessment','remediation','evidence-review']},
 {id:'personal-environmental-compliance',name:'Environmental Compliance',domain:'environment',skills:['compliance-mapping','environmental-law-context','audit','due-diligence','incident-review','controls']},
 {id:'personal-sustainability-advisor',name:'Environmental Business & Sustainability',domain:'environment',skills:['resource-efficiency','waste','emissions','water','materials','sustainability','business-case','implementation']},
 {id:'personal-research-analyst',name:'Research & Evidence',domain:'research',skills:['literature-review','source-triangulation','evidence-ranking','fact-checking','synthesis']},
 {id:'personal-data-analyst',name:'Data Analysis',domain:'analysis',skills:['data-cleaning','statistics','trend-analysis','visualization','business-intelligence']},
 {id:'personal-reporting',name:'Documentation & Reporting',domain:'reporting',skills:['technical-writing','audit-report','environmental-report','sop','decision-record','handoff']},
 {id:'personal-operations',name:'Operations',domain:'operations',skills:['planning','prioritization','workflow','cost','risk','coordination']}
]);
const RULES=Object.freeze({
 privateDevelopmentOnly:true,titanZeroRuntimeDependency:false,
 tenantBoundary:'company_id',
 authority:{advancePlan:false,directMutation:false,approveOwnMutation:false},
 evidenceRequired:true,
 environmental:{professionalJudgmentRequired:true,regulatoryCurrencyMustBeVerified:true,doNotFabricateMeasurements:true}
});
function list(){return WORKERS.map(w=>Object.freeze({...w,authority:RULES.authority}));}
function find(id){return list().find(w=>w.id===String(id||''))||null;}
function route(task={}){
 const text=String(task.text||task.task||task.title||'').toLowerCase();
 const scores=WORKERS.map(w=>({worker:w,score:w.skills.reduce((n,k)=>n+(text.includes(k.replaceAll('-',' '))||text.includes(k)?1:0),0)+(text.includes(w.domain)?2:0)})).sort((a,b)=>b.score-a.score);
 return {schema:'titan.code.personal-workforce.route.v1',primary:(scores[0]?.score||0)>0?scores[0].worker.id:'personal-research-analyst',candidates:scores.filter(x=>x.score>0).slice(0,4).map(x=>({id:x.worker.id,score:x.score})),rules:RULES};
}
global.TitanCodePersonalWorkforce=Object.freeze({WORKERS,RULES,list,find,route});
})(typeof globalThis!=='undefined'?globalThis:this);
