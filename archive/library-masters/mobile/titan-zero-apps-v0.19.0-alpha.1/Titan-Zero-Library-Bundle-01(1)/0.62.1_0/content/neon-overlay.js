// Dassi Chrome Extension v0.62.1
// © 2026 Omnify Labs. All rights reserved.
// Unauthorized copying or distribution is strictly prohibited.
if(typeof WorkerGlobalScope!=="undefined"&&self instanceof WorkerGlobalScope&&typeof globalThis.chrome==="undefined"){
  globalThis.chrome={runtime:{id:"pending-shim"}};
}
if(typeof globalThis.process==="undefined"){
  globalThis.process={env:{},versions:{},platform:"",arch:"",version:""};
}

"use strict";(()=>{var M={grey:"rgb(95, 99, 104)",blue:"rgb(26, 115, 232)",red:"rgb(217, 48, 37)",yellow:"rgb(251, 188, 5)",green:"rgb(30, 142, 62)",pink:"rgb(213, 0, 249)",purple:"rgb(142, 36, 170)",cyan:"rgb(0, 172, 193)",orange:"rgb(255, 111, 0)"};function U(n){console.log(`[GroupColors] Parsing color name: "${n}"`);let t=M[n]||M.cyan;console.log(`[GroupColors] Mapped to base color: ${t} (isKnown: ${!!M[n]})`);let e=t.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);if(!e)return console.warn(`[GroupColors] Failed to parse color: ${t}, using cyan`),{lighter:"rgba(0, 172, 193, 0.2)",light:"rgba(0, 172, 193, 0.4)",medium:"rgba(0, 172, 193, 0.6)",bright:"rgba(0, 172, 193, 0.8)",strong:"rgba(0, 172, 193, 0.8)",strongest:"rgba(0, 172, 193, 1)"};let[,c="0",s="0",u="0"]=e;return J(c,s,u)}function J(n,t,e){return{lighter:`rgba(${n}, ${t}, ${e}, 0.2)`,light:`rgba(${n}, ${t}, ${e}, 0.4)`,medium:`rgba(${n}, ${t}, ${e}, 0.6)`,bright:`rgba(${n}, ${t}, ${e}, 0.8)`,strong:`rgba(${n}, ${t}, ${e}, 0.8)`,strongest:`rgba(${n}, ${t}, ${e}, 1)`}}var v="data-dassi-ui",fe=`[${v}]`,z="dassi-neon-overlay-root",K="dassi-neon-overlay";function O(n,t={}){let e=document.createElement(n);return e.setAttribute("aria-hidden","true"),e.setAttribute(v,"true"),t.className&&(e.className=t.className),t.interactive||(e.style.pointerEvents="none"),e}var B=`
    @keyframes neon-breathing {
      0%, 100% {
        box-shadow:
          inset 0 0 20px var(--neon-color-light),
          inset 0 0 40px var(--neon-color-lighter),
          0 0 20px var(--neon-color-medium),
          0 0 40px var(--neon-color-light),
          0 0 60px var(--neon-color-lighter);
        border-color: var(--neon-color-strong);
      }
      50% {
        box-shadow:
          inset 0 0 30px var(--neon-color-medium),
          inset 0 0 60px var(--neon-color-light),
          0 0 30px var(--neon-color-bright),
          0 0 60px var(--neon-color-medium),
          0 0 90px var(--neon-color-light);
        border-color: var(--neon-color-strongest);
      }
    }

    #dassi-neon-overlay {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      pointer-events: none;
      z-index: 2147483647; /* Maximum z-index */
      border: 4px solid var(--neon-color-strong);
      border-radius: 8px;
      animation: neon-breathing 3s ease-in-out infinite;
      will-change: box-shadow, border-color, opacity;
      contain: style; /* Reason: isolates style recalc to this element; layout containment removed to prevent bottom reminder clipping */
      transition: opacity 0.3s ease-in-out;

      /* Default colors (cyan) - will be overridden by updateNeonOverlayColor */
      --neon-color-lighter: rgba(0, 172, 193, 0.2);
      --neon-color-light: rgba(0, 172, 193, 0.4);
      --neon-color-medium: rgba(0, 172, 193, 0.6);
      --neon-color-bright: rgba(0, 172, 193, 0.8);
      --neon-color-strong: rgba(0, 172, 193, 0.8);
      --neon-color-strongest: rgba(0, 172, 193, 1);
    }

    #dassi-neon-overlay.hidden {
      opacity: 0;
      animation-play-state: paused; /* Reason: stops box-shadow animation to eliminate idle paint events */
    }

    /* Reason: class toggle for screenshot capture \u2014 hides decorative effects
       while keeping corner coords and cursor visible for agent spatial reasoning.
       Uses CSS class instead of inline style mutations because Chrome permanently
       cancels CSS animations when animation:'none' is set via inline style. */
    #dassi-neon-overlay.dassi-screenshot {
      animation-play-state: paused;
      border-color: transparent;
      box-shadow: none;
    }
    #dassi-neon-overlay.dassi-screenshot .dassi-bottom-reminder,
    #dassi-neon-overlay.dassi-screenshot .dassi-overlay-corner {
      visibility: hidden;
    }
    #dassi-neon-overlay.dassi-screenshot ~ #dassi-sim-cursor {
      visibility: hidden;
    }

    /* Reason: during an agent coordinate gesture, neutralize hit-testing on
       EVERY overlay descendant (the only pointer-events:auto element today is
       the Stop button, but this future-proofs any new interactive element).
       Visibility is untouched, so the human still sees and \u2014 between agent
       gestures \u2014 can click the overlay. Toggled by withOverlayHidden('pointer'). */
    #dassi-neon-overlay.dassi-agent-acting * {
      pointer-events: none !important;
    }

    #dassi-neon-overlay .dassi-overlay-corner {
      position: absolute;
      font: 11px/1.2 ui-monospace, SFMono-Regular, Menlo, monospace;
      color: rgba(255, 255, 255, 0.95);
      background: rgba(0, 0, 0, 0.35);
      padding: 2px 6px;
      border-radius: 4px;
    }

    #dassi-neon-overlay .dassi-overlay-corner.top-left {
      top: 6px;
      left: 6px;
    }

    #dassi-neon-overlay .dassi-overlay-corner.bottom-right {
      right: 6px;
      bottom: 6px;
    }

    #dassi-click-marker {
      position: fixed;
      left: 0;
      top: 0;
      width: 12px;
      height: 12px;
      border-radius: 999px;
      background: rgba(255, 59, 48, 0.9);
      box-shadow: 0 0 0 2px #ffffff;
      transform: translate(-50%, -50%);
      pointer-events: none;
      z-index: 2147483647;
      display: none;
    }

    #dassi-click-marker .dassi-click-marker-label {
      position: absolute;
      left: 14px;
      top: 14px;
      font: 11px/1.2 ui-monospace, SFMono-Regular, Menlo, monospace;
      color: rgba(255, 255, 255, 0.95);
      background: rgba(0, 0, 0, 0.6);
      padding: 2px 6px;
      border-radius: 4px;
      white-space: nowrap;
    }

    #dassi-sim-cursor {
      position: fixed;
      left: 0;
      top: 0;
      width: 14px;
      height: 14px;
      border-radius: 999px;
      border: 2px solid rgba(255, 255, 255, 0.9);
      box-shadow: 0 0 0 1px rgba(0, 0, 0, 0.5);
      background: rgba(0, 0, 0, 0.15);
      transform: translate(-50%, -50%);
      pointer-events: none;
      z-index: 2147483647;
      display: none;
    }

    #dassi-sim-cursor .dassi-sim-cursor-label {
      position: absolute;
      left: 16px;
      top: 12px;
      font: 11px/1.2 ui-monospace, SFMono-Regular, Menlo, monospace;
      color: rgba(255, 255, 255, 0.95);
      background: rgba(0, 0, 0, 0.6);
      padding: 2px 6px;
      border-radius: 4px;
      white-space: nowrap;
    }

    #dassi-neon-overlay .dassi-bottom-reminder {
      position: absolute;
      bottom: 32px;
      left: 50%;
      transform: translateX(-50%);
      background: rgba(15, 23, 42, 0.85);
      color: rgba(255, 255, 255, 0.95);
      padding: 10px 20px;
      border-radius: 8px;
      font: 13px/1.4 -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      /* backdrop-filter removed to prevent GPU layer crash in React apps */
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
      border: 1px solid rgba(255, 255, 255, 0.1);
      max-width: 80%;
      text-align: center;
      pointer-events: none;
    }

    #dassi-neon-overlay .dassi-bottom-reminder-icon {
      width: 16px;
      height: 16px;
      margin-right: 8px;
      flex-shrink: 0;
    }

    #dassi-neon-overlay .dassi-bottom-reminder-content {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    #dassi-neon-overlay .dassi-bottom-reminder-text {
      display: flex;
      align-items: center;
    }

    #dassi-neon-overlay .dassi-stop-button {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 3px;
      padding: 4px 6px;
      background: rgba(239, 68, 68, 0.9);
      color: white;
      border: none;
      border-radius: 4px;
      font: 11px/1 -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      font-weight: 500;
      cursor: pointer;
      pointer-events: auto;
      transition: background 0.15s ease, transform 0.1s ease;
      white-space: nowrap;
    }

    #dassi-neon-overlay .dassi-stop-button:hover {
      background: rgba(220, 38, 38, 1);
    }

    #dassi-neon-overlay .dassi-stop-button:active {
      transform: scale(0.96);
    }

    #dassi-neon-overlay .dassi-stop-button:disabled {
      background: rgba(107, 114, 128, 0.8);
      cursor: not-allowed;
      transform: none;
    }

    #dassi-neon-overlay .dassi-stop-button .dassi-stop-icon {
      width: 8px;
      height: 8px;
      background: white;
      border-radius: 2px;
    }

    @keyframes dassi-spin {
      from { transform: rotate(0deg); }
      to { transform: rotate(360deg); }
    }

    #dassi-neon-overlay .dassi-stop-button .dassi-spinner {
      width: 10px;
      height: 10px;
      border: 1.5px solid rgba(255, 255, 255, 0.3);
      border-top-color: white;
      border-radius: 50%;
      animation: dassi-spin 0.8s linear infinite;
    }

    #dassi-neon-overlay .dassi-kbd {
      display: inline-block;
      padding: 2px 4px;
      margin-left: 4px;
      font: 9px/1 ui-monospace, SFMono-Regular, Menlo, monospace;
      font-weight: 500;
      text-transform: uppercase;
      background: rgba(255, 255, 255, 0.2);
      border-radius: 3px;
      letter-spacing: 0.3px;
    }
  `;async function Q(){return(await chrome.runtime.sendMessage({type:"checkGroupStatus"}))?.shouldShowOverlay===!0}function W(n){let t=null,e=!1;function c(){t=setTimeout(async()=>{t=null;let s;try{s=await Q()}catch{if(!e)return;e=!1,n.onOrphaned();return}if(e){if(!s){e=!1,n.onExpired();return}c()}},5e3)}return{start:()=>{e||(e=!0,c())},stop:()=>{e=!1,t!==null&&(clearTimeout(t),t=null)}}}var Z="debug:contentLog";function A(n,...t){try{chrome.runtime.sendMessage({type:Z,level:n,args:t})}catch{}}if(window.__DASSI_OVERLAY_LOADED__===!0)console.log("[NeonOverlay] Script already loaded, skipping initialization");else{let S=function(){if(n){console.debug("[NeonOverlay] Overlay already exists");return}n=document.createElement("div"),n.id=z,n.style.position="fixed",n.style.top="0",n.style.left="0",n.style.right="0",n.style.bottom="0",n.style.zIndex="2147483647",n.style.pointerEvents="none",n.setAttribute("aria-hidden","true"),n.setAttribute(v,"true"),t=n.attachShadow({mode:"open"}),c||(c=document.createElement("style"),c.id="dassi-neon-overlay-styles",c.textContent=B,t.appendChild(c)),e=O("div"),e.id=K;let o=document.createElement("div");o.className="dassi-overlay-corner top-left",o.textContent="[0, 0]";let r=document.createElement("div");r.className="dassi-overlay-corner bottom-right",y=()=>{r.textContent=`[${window.innerWidth}, ${window.innerHeight}]`},y(),window.addEventListener("resize",y),e.appendChild(o),e.appendChild(r),t.appendChild(e),P(),F(j),(document.documentElement||document.body).appendChild(n),console.debug("[NeonOverlay] Neon overlay created in Shadow DOM")},$=function(){s||(s=O("div"),s.id="dassi-click-marker",u=document.createElement("div"),u.className="dassi-click-marker-label",s.appendChild(u),t||h(),t.appendChild(s))},C=function(){a||(a=O("div"),a.id="dassi-sim-cursor",b=document.createElement("div"),b.className="dassi-sim-cursor-label",a.appendChild(b),a.style.display=p?"block":"none",t||h(),t.appendChild(a),L({x:window.innerWidth/2,y:window.innerHeight/2}))},D=function(){p=!0,C(),a&&(a.style.display="block")},H=function(){p=!1,a&&(a.style.display="none")},L=function(o){if(C(),!a||!b)return;let r=Math.round(o.x),l=Math.round(o.y);a.style.left=`${r}px`,a.style.top=`${l}px`,b.textContent=`[${r}, ${l}]`,a.style.display=p?"block":"none"},V=function(o,r){$(),!(!s||!u)&&(s.style.left=`${o.x}px`,s.style.top=`${o.y}px`,u.textContent=r??`[${Math.round(o.x)}, ${Math.round(o.y)}]`,s.style.display="block")},I=function(){s&&(s.style.display="none")},P=function(){g||(e||S(),g=document.createElement("div"),g.className="dassi-bottom-reminder",e?.appendChild(g))},G=function(){return chrome.runtime.getURL("assets/icon128.png")},x=function(){if(i)if(i.textContent="",m){let o=document.createElement("span");o.className="dassi-spinner",i.appendChild(o),i.appendChild(document.createTextNode("Stopping...")),i.disabled=!0}else{let o=document.createElement("span");o.className="dassi-stop-icon",i.appendChild(o),i.appendChild(document.createTextNode("Stop"));let r=document.createElement("kbd");r.className="dassi-kbd",r.textContent=q,i.appendChild(r),i.disabled=!1}},F=function(o,r){if(!g)return;let l=r||G();g.textContent="";let d=document.createElement("div");d.className="dassi-bottom-reminder-content";let f=document.createElement("div");f.className="dassi-bottom-reminder-text";let w=document.createElement("img");w.className="dassi-bottom-reminder-icon",w.src=l,w.alt="dassi",f.appendChild(w),f.appendChild(document.createTextNode(o)),i=document.createElement("button"),i.className="dassi-stop-button",i.addEventListener("click",Y=>{Y.preventDefault(),Y.stopPropagation(),X()}),x(),d.appendChild(f),d.appendChild(i),g.appendChild(d)},_=function(o){if(!e)return;console.log(`[NeonOverlay] Updating color to: "${o}"`);let r=U(o);console.log("[NeonOverlay] Parsed colors:",{lighter:r.lighter,light:r.light,medium:r.medium,bright:r.bright,strong:r.strong,strongest:r.strongest}),e.style.setProperty("--neon-color-lighter",r.lighter),e.style.setProperty("--neon-color-light",r.light),e.style.setProperty("--neon-color-medium",r.medium),e.style.setProperty("--neon-color-bright",r.bright),e.style.setProperty("--neon-color-strong",r.strong),e.style.setProperty("--neon-color-strongest",r.strongest),console.log("[NeonOverlay] CSS variables set successfully")},h=function(){p||(e||S(),e&&(e.classList.remove("hidden"),_(R||"cyan")),D(),m=!1,p=!0,k.start(),console.debug("[NeonOverlay] Overlay activated"))},N=function(o){o&&(R=o),h(),o&&e&&_(o)},T=function(){k.stop(),e&&e.classList.add("hidden"),H(),p=!1,m=!1,y&&(window.removeEventListener("resize",y),y=null),console.debug("[NeonOverlay] Overlay deactivated")},E=function(){k.stop(),n&&(n.remove(),n=null,t=null,console.debug("[NeonOverlay] Shadow host removed")),e=null,c=null,s=null,u=null,a=null,b=null,g=null,i=null,p=!1,m=!1};ee=S,oe=$,ne=C,te=D,re=H,se=L,ae=V,ie=I,le=P,de=G,ce=x,pe=F,ue=_,ge=h,me=N,be=T,ye=E,window.__DASSI_OVERLAY_LOADED__=!0;let n=null,t=null,e=null,c=null,s=null,u=null,a=null,b=null,g=null,i=null,p=!1,m=!1,y=null,R,k=W({onExpired:T,onOrphaned:E}),j="dassi is controlling your browser";async function X(){if(!m){m=!0,x(),console.log("[NeonOverlay] Stop button clicked, sending stopFromOverlay message");try{await chrome.runtime.sendMessage({type:"stopFromOverlay"}),console.log("[NeonOverlay] stopFromOverlay message sent successfully")}catch(o){console.error("[NeonOverlay] Failed to send stopFromOverlay message:",o),A("error","[NeonOverlay] Failed to send stopFromOverlay message:",String(o)),m=!1,x()}}}let q=navigator.platform.includes("Mac")?"\u2318\u21E7C":"Ctrl+Shift+C";chrome.runtime.onMessage.addListener((o,r,l)=>{if(typeof o!="object"||o===null)return;let d=o;switch(["showClickMarker","updateCursorPosition"].includes(d.type)&&!p&&h(),d.type){case"ping":l({ready:!0});break;case"showNeonOverlay":N(d.groupColor),l({success:!0});break;case"hideNeonOverlay":T(),l({success:!0});break;case"removeNeonOverlay":E(),l({success:!0});break;case"showClickMarker":d.coordinate&&(V(d.coordinate,d.label),l({success:!0}));break;case"hideClickMarker":I(),l({success:!0});break;case"updateCursorPosition":d.coordinate&&(L(d.coordinate),l({success:!0}));break;default:break}return!1}),window.addEventListener("beforeunload",()=>{E()}),console.debug("[NeonOverlay] Content script loaded"),A("debug","[NeonOverlay] Content script loaded"),(async()=>{try{let o=await chrome.runtime.sendMessage({type:"checkGroupStatus"});if(o?.shouldShowOverlay){let r=o.groupColor;console.debug(`[NeonOverlay] Auto-showing overlay (group is active) with color: ${r}`),N(r)}else console.debug("[NeonOverlay] Not showing overlay (group is not active)")}catch(o){console.debug("[NeonOverlay] Could not check group status:",o)}})()}var ee,oe,ne,te,re,se,ae,ie,le,de,ce,pe,ue,ge,me,be,ye;})();
