(function attachCodeeBrowserTabRegistry(global) {
'use strict';
const sessions=new Map();
function cleanTab(tab){return {id:Number(tab.id),windowId:Number(tab.windowId||0),active:tab.active===true,pinned:tab.pinned===true,title:String(tab.title||'').slice(0,500),url:String(tab.url||'').slice(0,8000),status:String(tab.status||'unknown')};}
async function list(){if(!global.chrome?.tabs?.query) throw new Error('browser-tabs-api-unavailable');const tabs=await global.chrome.tabs.query({});return tabs.filter(t=>Number.isInteger(Number(t.id))).map(cleanTab);}
function connect(tab){const row=cleanTab(tab);sessions.set(row.id,{tab:row,connectedAt:new Date().toISOString(),state:'CONNECTED'});return sessions.get(row.id);}
function disconnect(tabId){const id=Number(tabId);const prior=sessions.get(id)||null;sessions.delete(id);return {ok:true,tabId:id,prior};}
function get(tabId){return sessions.get(Number(tabId))||null;}
function status(){return {schema:'titan.code.browser.tabs.v1',sessions:Array.from(sessions.values()),authority:{advancePlan:false,mutateRepository:false,mutateServer:false},privateDevelopmentOnly:true,titanZeroRuntimeDependency:false};}
global.CodeeBrowserTabRegistry=Object.freeze({list,connect,disconnect,get,status,cleanTab});
})(typeof globalThis!=='undefined'?globalThis:this);
