(function(g){'use strict';
function classify(input={}){const a=(input.action||input.text||'').toLowerCase();if(/delete|drop|truncate|force|production write|deploy/.test(a))return {level:'high',approval:true};if(/write|edit|migration|command|install|update/.test(a))return {level:'medium',approval:true};return {level:'low',approval:false};}
g.CodeeWorkforceRiskClassifier=Object.freeze({classify});})(globalThis);
