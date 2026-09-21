(function(g){'use strict';
function resolve(recommendations=[]){const high=recommendations.filter(x=>x.risk==='high');return {status:high.length>1?'needs-review':'mergeable',recommendations:[...recommendations],rule:'evidence-first; higher-risk conflicts require human/runner decision',authority:{decidePlan:false}};}
g.CodeeManagerConflictResolver=Object.freeze({resolve});})(globalThis);
