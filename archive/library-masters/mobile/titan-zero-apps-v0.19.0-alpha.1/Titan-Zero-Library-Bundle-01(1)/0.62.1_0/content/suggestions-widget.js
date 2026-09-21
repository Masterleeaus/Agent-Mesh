// Dassi Chrome Extension v0.62.1
// © 2026 Omnify Labs. All rights reserved.
// Unauthorized copying or distribution is strictly prohibited.
if(typeof WorkerGlobalScope!=="undefined"&&self instanceof WorkerGlobalScope&&typeof globalThis.chrome==="undefined"){
  globalThis.chrome={runtime:{id:"pending-shim"}};
}
if(typeof globalThis.process==="undefined"){
  globalThis.process={env:{},versions:{},platform:"",arch:"",version:""};
}

"use strict";(()=>{var B=[{code:"en",label:"English"},{code:"es",label:"Espa\xF1ol"},{code:"ja",label:"\u65E5\u672C\u8A9E"},{code:"ko",label:"\uD55C\uAD6D\uC5B4"},{code:"zh-CN",label:"\u7B80\u4F53\u4E2D\u6587"},{code:"fr",label:"Fran\xE7ais"},{code:"de",label:"Deutsch"}],j=B.map(o=>o.code),W=[{id:"general",tabs:["preferences","workflows"]},{id:"agent",tabs:["models"]},{id:"knowledge",tabs:["memory","references","skills","plugins"]},{id:"account",tabs:["plan","gateway","contact"]}],q=W.flatMap(o=>[...o.tabs]);var F={"dassi-managed":"dassi",openai:"openai","openai-codex":"codex",anthropic:"anthropic",google:"google",deepseek:"deepseek",openrouter:"openrouter",moonshotai:"moonshotai",xai:"xai",groq:"groq",mistral:"mistral",custom:"custom",novita:"novita",azure:"azure"},ge=Object.fromEntries(Object.entries(F).map(([o,a])=>[a,o]));var _e=300*1e3,x=604800;var K="debug:contentLog";function p(o,...a){try{chrome.runtime.sendMessage({type:K,level:o,args:a})}catch{}}if(window.__DASSI_SUGGESTIONS_WIDGET_LOADED__===!0)console.log("[SuggestionsWidget] Already loaded, skipping");else{let L=function(e){return!(e.startsWith("chrome://")||e.startsWith("chrome-extension://")||e.startsWith("about:")||e.startsWith("devtools://")||e.startsWith("edge://")||window.locationbar&&!window.locationbar.visible)},O=function(){console.log("[SuggestionsWidget] hideWidget called, widgetElement:",!!t),c=!0,t&&t.classList.add("hidden")},D=function(){if(U(),t){let e=t.querySelector(".dassi-widget-panel");e?(e.classList.add("closing"),setTimeout(()=>{t?.remove(),r?.remove()},150)):(t.remove(),r?.remove())}},d=function(){if(t){if(t.innerHTML="",c||n.length===0){t.classList.add("hidden");return}if(t.classList.remove("hidden"),m){let e=document.createElement("div");e.className="dassi-widget-panel";let s=document.createElement("div");s.className="dassi-widget-header";let i=document.createElement("div");i.className="dassi-widget-title";let l=document.createElement("img");l.src=I,l.alt="dassi",i.appendChild(l),i.appendChild(document.createTextNode("dassi can help"));let g=document.createElement("button");g.className="dassi-widget-close",g.innerHTML="&times;",g.title="Dismiss (won't show for a week)",g.addEventListener("click",_=>{_.stopPropagation(),D()}),s.appendChild(i),s.appendChild(g),e.appendChild(s);let S=document.createElement("div");S.className="dassi-widget-list";for(let _ of n){let E=document.createElement("button");E.className="dassi-widget-item";let f=document.createElement("div");f.className="dassi-widget-item-title",f.textContent=_.title,E.appendChild(f),E.addEventListener("click",()=>C(_)),S.appendChild(E)}e.appendChild(S),t.appendChild(e),e.addEventListener("mouseleave",()=>{m=!1,d()})}else{let e=document.createElement("button");e.className="dassi-widget-trigger",e.textContent="!",e.title="dassi has suggestions",e.addEventListener("mouseenter",()=>{m=!0,d()}),t.appendChild(e)}}};H=L,X=O,V=D,z=d,window.__DASSI_SUGGESTIONS_WIDGET_LOADED__=!0;let o="dassi_suggestions_dismissed_at",a="dassi_suggestions_debug",h="appConfig",u="dassi_suggestions_enabled",I=chrome.runtime.getURL("assets/icon128.png"),w="#f97316",N="249, 115, 22";async function A(){try{return((await chrome.storage.local.get(h))[h]?.config?.suggestions_cooldown_seconds??x)*1e3}catch{return x*1e3}}let n=[],m=!1,c=!1,t=null,r=null,R=`
    #dassi-suggestions-widget {
      position: fixed;
      bottom: 120px;
      right: 0;
      z-index: 2147483646;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      font-size: 14px;
      -webkit-font-smoothing: antialiased;
    }

    #dassi-suggestions-widget * {
      box-sizing: border-box;
    }

    /* Collapsed state - tiny exclamation mark with bounce */
    .dassi-widget-trigger {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 18px;
      height: 18px;
      padding: 0;
      background: ${w};
      border: none;
      border-radius: 4px 0 0 4px;
      box-shadow: -1px 1px 4px rgba(0, 0, 0, 0.15);
      cursor: pointer;
      transition: all 0.2s ease;
      font-size: 11px;
      font-weight: 700;
      color: white;
      animation: dassi-bounce-in 0.6s cubic-bezier(0.68, -0.55, 0.265, 1.55),
                 dassi-bounce-pulse 4s ease-in-out 0.6s infinite;
    }

    @keyframes dassi-bounce-in {
      0% {
        opacity: 0;
        transform: translateX(20px) scale(0.3);
      }
      50% {
        transform: translateX(-8px) scale(1.1);
      }
      70% {
        transform: translateX(4px) scale(0.95);
      }
      100% {
        opacity: 1;
        transform: translateX(0) scale(1);
      }
    }

    .dassi-widget-trigger:hover {
      width: 22px;
      height: 22px;
      font-size: 13px;
      box-shadow: -2px 2px 8px rgba(${N}, 0.4);
      animation: none; /* Stop bouncing on hover */
    }

    /* Continuous bounce every 4s */
    @keyframes dassi-bounce-pulse {
      0%, 100% {
        transform: translateX(0) scale(1);
      }
      5% {
        transform: translateX(-4px) scale(1.15);
      }
      10% {
        transform: translateX(2px) scale(0.95);
      }
      15% {
        transform: translateX(0) scale(1);
      }
    }

    /* Expanded panel */
    .dassi-widget-panel {
      position: absolute;
      bottom: 0;
      right: 8px;
      width: 300px;
      background: white;
      border-radius: 12px;
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.18);
      overflow: hidden;
      animation: dassi-expand 0.2s ease-out;
    }

    @keyframes dassi-expand {
      from { opacity: 0; transform: translateX(10px) scale(0.95); }
      to { opacity: 1; transform: translateX(0) scale(1); }
    }

    .dassi-widget-panel.closing {
      animation: dassi-collapse 0.15s ease-in forwards;
    }

    @keyframes dassi-collapse {
      from { opacity: 1; transform: translateX(0) scale(1); }
      to { opacity: 0; transform: translateX(10px) scale(0.95); }
    }

    .dassi-widget-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 12px 14px;
      border-bottom: 1px solid #e5e7eb;
    }

    .dassi-widget-title {
      display: flex;
      align-items: center;
      gap: 8px;
      font-weight: 600;
      color: #111827;
      font-size: 14px;
    }

    .dassi-widget-title img {
      width: 20px;
      height: 20px;
    }

    .dassi-widget-close {
      background: none;
      border: none;
      font-size: 18px;
      color: #9ca3af;
      cursor: pointer;
      width: 28px;
      height: 28px;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 6px;
      transition: all 0.15s;
    }

    .dassi-widget-close:hover {
      background: #fee2e2;
      color: #dc2626;
    }

    .dassi-widget-list {
      padding: 8px;
      max-height: 300px;
      overflow-y: auto;
    }

    .dassi-widget-item {
      width: 100%;
      padding: 12px;
      margin-bottom: 6px;
      background: #f9fafb;
      border: 1px solid #e5e7eb;
      border-radius: 8px;
      text-align: left;
      cursor: pointer;
      transition: all 0.15s;
      animation: dassi-item-in 0.2s ease-out backwards;
    }

    .dassi-widget-item:nth-child(1) { animation-delay: 0.05s; }
    .dassi-widget-item:nth-child(2) { animation-delay: 0.1s; }
    .dassi-widget-item:nth-child(3) { animation-delay: 0.15s; }

    .dassi-widget-item:last-child {
      margin-bottom: 0;
    }

    .dassi-widget-item:hover {
      background: #f3f4f6;
      border-color: #6366f1;
      transform: translateX(-2px);
    }

    .dassi-widget-item:active {
      transform: scale(0.98);
    }

    @keyframes dassi-item-in {
      from { opacity: 0; transform: translateY(8px); }
      to { opacity: 1; transform: translateY(0); }
    }

    .dassi-widget-item-title {
      font-weight: 500;
      color: #111827;
      font-size: 13px;
      margin-bottom: 3px;
    }

    .dassi-widget-item-desc {
      font-size: 12px;
      color: #6b7280;
      line-height: 1.4;
    }

    /* Hidden state */
    #dassi-suggestions-widget.hidden {
      display: none;
    }

    /* Loading state */
    .dassi-widget-loading {
      padding: 20px;
      text-align: center;
      color: #6b7280;
    }

    .dassi-spinner {
      width: 24px;
      height: 24px;
      border: 3px solid #e5e7eb;
      border-top-color: #6366f1;
      border-radius: 50%;
      animation: dassi-spin 0.8s linear infinite;
      margin: 0 auto 8px;
    }

    @keyframes dassi-spin {
      to { transform: rotate(360deg); }
    }
  `;async function P(){let s=(await chrome.storage.local.get([o]))[o];if(!s||typeof s!="number")return!1;let i=Date.now()-s,l=await A();return i<l}async function U(){chrome.storage.local.set({[o]:Date.now()});let s=await A()/1e3;console.log(`[SuggestionsWidget] Cooldown started for ${s} seconds`)}async function y(){try{let e=await chrome.runtime.sendMessage({type:"fetchSuggestions",url:window.location.href});return e?.success&&e.suggestions?.length>0?e.suggestions:[]}catch(e){return console.error("[SuggestionsWidget] Fetch error:",e),p("error","[SuggestionsWidget] Fetch error:",String(e)),[]}}async function C(e){console.log("[SuggestionsWidget] Executing:",e.title);try{await chrome.runtime.sendMessage({type:"executeSuggestion",prompt:e.prompt})}catch(s){console.error("[SuggestionsWidget] Execute error:",s),p("error","[SuggestionsWidget] Execute error:",String(s))}}async function M(){try{let e=await chrome.storage.local.get(u);return typeof e[u]!="boolean"?!1:e[u]}catch{return!1}}async function T(){try{let e=await chrome.runtime.sendMessage({type:"isSidepanelActive"});return console.log("[SuggestionsWidget] Sidepanel active:",e?.active),e?.active===!0}catch(e){return console.error("[SuggestionsWidget] isSidepanelActive error:",e),!1}}async function G(){try{return(await chrome.storage.local.get(a))[a]===!0}catch{return!1}}async function v(){if(!L(window.location.href)){console.log("[SuggestionsWidget] Invalid URL, skipping");return}if(!await M()){console.log("[SuggestionsWidget] Disabled in options, skipping");return}if(await G())console.log("[SuggestionsWidget] Debug mode enabled");else if(await P()){console.log("[SuggestionsWidget] In cooldown period, skipping");return}if(r=document.createElement("style"),r.id="dassi-suggestions-widget-styles",r.textContent=R,document.head.appendChild(r),t=document.createElement("div"),t.id="dassi-suggestions-widget",t.setAttribute("aria-hidden","true"),t.setAttribute("data-dassi-ui","true"),t.classList.add("hidden"),document.body.appendChild(t),console.log("[SuggestionsWidget] Fetching suggestions silently..."),n=await y(),n.length>0){if(console.log(`[SuggestionsWidget] Got ${n.length} suggestions`),await T()){console.log("[SuggestionsWidget] Sidepanel is active, not showing widget"),c=!0;return}d()}else console.log("[SuggestionsWidget] No suggestions available")}chrome.runtime.onMessage.addListener((e,s,i)=>(e?.type==="hideWidget"?(console.log("[SuggestionsWidget] Hiding widget"),O(),i({success:!0})):e?.type==="showWidget"&&(console.log("[SuggestionsWidget] Showing widget (sidepanel closed)"),c=!1,n.length>0&&d(),i({success:!0})),!1)),document.addEventListener("visibilitychange",async()=>{if(document.visibilityState==="visible"&&n.length>0){let e=await T();console.log(`[SuggestionsWidget] Tab visible, sidepanel active: ${e}`),e?O():(c=!1,d())}});let b=()=>{v().catch(e=>{console.error("[SuggestionsWidget] Init failed:",e),p("error","[SuggestionsWidget] Init failed:",String(e))})};document.readyState==="loading"?document.addEventListener("DOMContentLoaded",b):b(),console.debug("[SuggestionsWidget] Content script loaded"),p("debug","[SuggestionsWidget] Content script loaded")}var H,X,V,z;})();
