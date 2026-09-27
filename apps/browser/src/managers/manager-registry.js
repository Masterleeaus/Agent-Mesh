(function(g){'use strict';
const byId=new Map();function load(managers=g.CodeeManagerCatalog||[]){byId.clear();for(const m of managers){if(byId.has(m.id))throw new Error(`Duplicate manager ${m.id}`);byId.set(m.id,m);}return list();}function get(id){return byId.get(id)||null}function list(){return [...byId.values()]};load();g.CodeeManagerRegistry=Object.freeze({load,get,list});})(globalThis);
