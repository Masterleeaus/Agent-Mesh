(function(g){'use strict';
const SCHEMA='titan-zero.manager.restart-snapshot.v1';
function freeze(v){if(!v||typeof v!=='object'||Object.isFrozen(v))return v;Object.freeze(v);for(const k of Object.keys(v))freeze(v[k]);return v;}
function stable(v){if(Array.isArray(v))return '['+v.map(stable).join(',')+']';if(v&&typeof v==='object')return '{'+Object.keys(v).sort().map(k=>JSON.stringify(k)+':'+stable(v[k])).join(',')+'}';return JSON.stringify(v);}
function checksum(s){let h1=2166136261,h2=2246822519;for(let i=0;i<s.length;i++){const c=s.charCodeAt(i);h1^=c;h1=Math.imul(h1,16777619);h2^=c;h2=Math.imul(h2,3266489917);}const hex=n=>(n>>>0).toString(16).padStart(8,'0');return (hex(h1)+hex(h2)).repeat(4).slice(0,64);}
function snapshot(state={}){const payload=JSON.parse(JSON.stringify(state));return freeze({schema:SCHEMA,payload,checksum:checksum(stable(payload))});}
function restore(snap={}){if(snap.schema!==SCHEMA||!snap.payload)throw new Error('invalid restart snapshot');const expected=checksum(stable(snap.payload));if(expected!==snap.checksum)throw new Error('restart snapshot checksum mismatch');const out=JSON.parse(JSON.stringify(snap.payload));out.restart={reconstructed:true,integrityVerified:true};return freeze(out);}
g.TitanZeroManagerRestartReconstruction=freeze({SCHEMA,snapshot,restore,checksum});
})(typeof globalThis!=='undefined'?globalThis:this);
