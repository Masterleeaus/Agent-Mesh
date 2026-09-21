
import assert from 'node:assert/strict';
import {compareMetricWindows,varianceFromTarget} from '../titan-runtime/analytics/kpi-trend-variance.mjs';

const base={metric_id:'cleaning.jobs_completed',company_id:'c1',status:'available',provenance:[{source_id:'jobs-runtime',source_ref:'x'}]};
const up=compareMetricWindows({company_id:'c1',
 previous:{...base,value:10,window:{start:'p1',end:'p2'}},
 current:{...base,value:15,window:{start:'c1',end:'c2'}}
});
assert.equal(up.delta,5); assert.equal(up.percent_change,0.5); assert.equal(up.direction,'up'); assert.equal(up.status,'available');

const zero=compareMetricWindows({company_id:'c1',
 previous:{...base,value:0}, current:{...base,value:5}
});
assert.equal(zero.status,'partial'); assert.equal(zero.percent_change,null);

const missing=compareMetricWindows({company_id:'c1',
 previous:{...base,status:'missing',value:null}, current:{...base,value:5}
});
assert.equal(missing.status,'missing'); assert.equal(missing.delta,null);

const partial=compareMetricWindows({company_id:'c1',
 previous:{...base,status:'partial',value:10}, current:{...base,value:12}
});
assert.equal(partial.status,'partial'); assert.equal(partial.delta,2);

const variance=varianceFromTarget({company_id:'c1',metric:{...base,value:80},target:100});
assert.equal(variance.variance,-20); assert.equal(variance.percent_variance,-0.2); assert.equal(variance.direction,'below');

const varianceZero=varianceFromTarget({company_id:'c1',metric:{...base,value:5},target:0});
assert.equal(varianceZero.status,'partial'); assert.equal(varianceZero.percent_variance,null);

assert.throws(()=>compareMetricWindows({company_id:'c1',
 previous:{...base,company_id:'c2',value:1},current:{...base,value:2}}),/cross-company/);
assert.throws(()=>varianceFromTarget({tenant_id:'legacy',company_id:'c1',metric:{...base,value:1},target:2}),/Legacy tenant boundary/);

console.log('PASS KPI Pass05 trend/variance missing, partial, zero-baseline and company isolation semantics');
