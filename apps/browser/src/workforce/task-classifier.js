(function(g){'use strict';
const RULES=[
 ['laravel',/laravel|artisan|eloquent|blade|livewire|controller|service provider/i],
 ['database',/database|schema|sql|migration|mysql|table|column|tenant_company_id/i],
 ['runtime',/500|exception|error|log|runtime|crash|failed/i],
 ['frontend',/react|javascript|typescript|css|tailwind|vite|ui|frontend|blade/i],
 ['security',/security|auth|oauth|permission|secret|token|csrf|xss|sql injection/i],
 ['extension',/extension|app\/Extensions|plugin|module/i],
 ['testing',/test|phpunit|pest|regression|verify/i],
 ['release',/release|deploy|version|package|zip|artifact|production/i],
 ['architecture',/architecture|design|refactor|dependency|boundary|domain/i],
 ['integration',/integration|api|mcp|connector|provider|webhook/i],
 ['repository',/repository|repo|file|git|diff|commit|branch/i],
 ['planning',/plan|roadmap|steps|pass|scope/i],
 ['documentation',/documentation|docs?|readme|changelog|handoff|runbook|guide|reference/i],
 ['governance',/governance|approval|audit|backup|rollback|policy|compliance|authority/i]
];
function classify(input={}){const text=[input.text,input.goal,input.task].filter(Boolean).join(' ');const tags=RULES.filter(([,r])=>r.test(text)).map(([t])=>t);return {text,tags:tags.length?tags:['general'],confidence:tags.length?Math.min(.95,.55+tags.length*.08):.35};}
g.CodeeWorkforceTaskClassifier=Object.freeze({classify,RULES});})(globalThis);
