import"./modulepreload-polyfill-Cf3xff8G.js";var e=`
  * { margin: 0; padding: 0; box-sizing: border-box; }

  body {
    font-family: 'Outfit', system-ui, -apple-system, sans-serif;
    background: #FAFAFA;
    color: #1A1A1A;
    line-height: 1.7;
    -webkit-font-smoothing: antialiased;
  }

  .container {
    max-width: 760px;
    margin: 0 auto;
    padding: 60px 32px 100px;
  }

  /* Header */
  .header {
    text-align: center;
    margin-bottom: 48px;
    padding-bottom: 32px;
    border-bottom: 1px solid #E5E5E5;
  }
  .brand {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    margin-bottom: 20px;
    font-size: 13px;
    font-weight: 700;
    color: #A64D33;
    letter-spacing: 1.5px;
    text-transform: uppercase;
  }
  .brand svg { flex-shrink: 0; }
  .title {
    font-size: 32px;
    font-weight: 800;
    color: #1A1A1A;
    letter-spacing: -0.5px;
    line-height: 1.3;
    margin-bottom: 12px;
  }
  .meta {
    font-size: 13px;
    color: #888;
    font-weight: 400;
  }

  /* Table of Contents */
  .toc {
    background: #FFFFFF;
    border: 1px solid #E5E5E5;
    border-radius: 12px;
    padding: 24px 28px;
    margin-bottom: 40px;
  }
  .toc-title {
    font-size: 11px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 1.5px;
    color: #A64D33;
    margin-bottom: 14px;
  }
  .toc-list {
    list-style: none;
    counter-reset: toc;
  }
  .toc-list li {
    counter-increment: toc;
    margin-bottom: 8px;
  }
  .toc-list li a {
    font-size: 14px;
    color: #333;
    text-decoration: none;
    font-weight: 500;
    transition: color 0.15s;
    display: flex;
    align-items: baseline;
    gap: 10px;
  }
  .toc-list li a:hover { color: #A64D33; }
  .toc-list li a::before {
    content: counter(toc, decimal-leading-zero);
    font-size: 12px;
    font-weight: 700;
    color: #A64D33;
    flex-shrink: 0;
    width: 20px;
  }

  /* Section */
  .section {
    margin-bottom: 16px;
    padding-bottom: 32px;
    border-bottom: 1px solid #F0F0F0;
  }
  .section:last-of-type {
    border-bottom: none;
  }
  .section-header {
    display: flex;
    align-items: center;
    gap: 12px;
    margin-bottom: 18px;
  }
  .section-number {
    width: 32px;
    height: 32px;
    border-radius: 8px;
    background: rgba(166, 77, 51, 0.08);
    color: #A64D33;
    font-size: 14px;
    font-weight: 700;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }
  .section-title {
    font-size: 18px;
    font-weight: 700;
    color: #1A1A1A;
    line-height: 1.3;
  }

  /* Section Body - Rich Text */
  .section-body {
    font-size: 15px;
    color: #333;
    line-height: 1.8;
    padding-left: 44px;
    margin-bottom: 14px;
  }
  .section-body p {
    margin-bottom: 14px;
  }
  .section-body p:last-child {
    margin-bottom: 0;
  }
  .section-body strong {
    color: #1A1A1A;
    font-weight: 600;
  }
  .section-body em {
    font-style: italic;
    color: #555;
  }

  /* Bullet Lists */
  .section-body ul {
    list-style: none;
    margin: 14px 0;
    padding: 0;
  }
  .section-body ul li {
    position: relative;
    padding-left: 20px;
    margin-bottom: 10px;
    line-height: 1.65;
  }
  .section-body ul li::before {
    content: '';
    position: absolute;
    left: 0;
    top: 10px;
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: #A64D33;
  }

  /* Numbered Lists */
  .section-body ol {
    margin: 14px 0;
    padding-left: 20px;
    counter-reset: ol-counter;
    list-style: none;
  }
  .section-body ol li {
    position: relative;
    padding-left: 8px;
    margin-bottom: 10px;
    line-height: 1.65;
    counter-increment: ol-counter;
  }
  .section-body ol li::before {
    content: counter(ol-counter) '.';
    position: absolute;
    left: -20px;
    font-weight: 700;
    color: #A64D33;
    font-size: 13px;
  }

  /* Key Highlight Box */
  .key-highlight {
    background: rgba(166, 77, 51, 0.04);
    border-left: 3px solid #A64D33;
    padding: 12px 16px;
    border-radius: 0 8px 8px 0;
    margin: 14px 0;
    font-size: 14px;
    color: #444;
    line-height: 1.6;
  }
  .key-highlight strong {
    color: #A64D33;
  }

  /* Section Divider */
  .section-body hr {
    border: none;
    height: 1px;
    background: #EBEBEB;
    margin: 18px 0;
  }

  /* Sources */
  .sources {
    padding-left: 44px;
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    margin-top: 10px;
  }
  .source-chip {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    background: #F0F0F0;
    border-radius: 20px;
    padding: 4px 12px;
    font-size: 11px;
    font-weight: 500;
    color: #666;
    text-decoration: none;
    transition: all 0.15s;
    max-width: 220px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .source-chip:hover {
    background: rgba(166, 77, 51, 0.1);
    color: #A64D33;
  }

  /* Footer */
  .footer {
    text-align: center;
    padding-top: 40px;
    border-top: 1px solid #E5E5E5;
    margin-top: 20px;
  }
  .footer-text {
    font-size: 12px;
    color: #AAA;
    font-weight: 400;
  }
  .footer-brand {
    color: #A64D33;
    font-weight: 600;
  }

  /* Loading */
  .loading-state {
    text-align: center;
    padding: 120px 20px;
  }
  .loading-spinner {
    width: 32px;
    height: 32px;
    border: 3px solid #E5E5E5;
    border-top-color: #A64D33;
    border-radius: 50%;
    animation: rspin 0.8s linear infinite;
    margin: 0 auto 16px;
  }
  @keyframes rspin { to { transform: rotate(360deg); } }
  .loading-text {
    font-size: 14px;
    color: #888;
  }
  .error-state {
    text-align: center;
    padding: 120px 20px;
    color: #CC3333;
    font-size: 15px;
  }

  @media print {
    body { background: white; }
    .container { padding: 20px; }
    .source-chip { background: #EEE; }
  }
`;function t(e){try{return new URL(e).hostname.replace(`www.`,``)}catch{return e}}function n(e){return new Date(e).toLocaleDateString(`en-US`,{year:`numeric`,month:`long`,day:`numeric`,hour:`2-digit`,minute:`2-digit`})}function r(r){let o=document.getElementById(`root`);if(!o)return;let s=document.createElement(`style`);s.textContent=e,document.head.appendChild(s),document.title=r.plan.title+` — Privane AI Research`;let c=`<div class="container">`;c+=`<div class="header">`,c+=`<div class="brand">`,c+=`<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M12 2v20"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>`,c+=`PRIVANE AI RESEARCH`,c+=`</div>`,c+=`<h1 class="title">`+i(r.plan.title)+`</h1>`,c+=`<div class="meta">Query: "`+i(r.query)+`" · Generated on `+n(r.completedAt)+`</div>`,c+=`</div>`,c+=`<div class="toc">`,c+=`<div class="toc-title">Table of Contents</div>`,c+=`<ol class="toc-list">`,r.sections.forEach(function(e,t){c+=`<li><a href="#section-`+t+`">`+i(e.goal)+`</a></li>`}),c+=`</ol>`,c+=`</div>`,r.sections.forEach(function(e,n){c+=`<div class="section" id="section-`+n+`">`,c+=`<div class="section-header">`,c+=`<div class="section-number">`+(n+1)+`</div>`,c+=`<h2 class="section-title">`+i(e.goal)+`</h2>`,c+=`</div>`,c+=`<div class="section-body">`+a(e.content)+`</div>`,e.sources&&e.sources.length>0&&(c+=`<div class="sources">`,e.sources.forEach(function(e){e.url&&e.title&&(c+=`<a class="source-chip" href="`+i(e.url)+`" target="_blank" title="`+i(e.title)+`">`,c+=`🔗 `+i(t(e.url)),c+=`</a>`)}),c+=`</div>`),c+=`</div>`}),c+=`<div class="footer">`,c+=`<div class="footer-text">Generated by <span class="footer-brand">Privane Browser AI Intelligence</span> · Powered by Gemma 2B on-device</div>`,c+=`</div>`,c+=`</div>`,o.innerHTML=c}function i(e){return e.replace(/&/g,`&amp;`).replace(/</g,`&lt;`).replace(/>/g,`&gt;`).replace(/"/g,`&quot;`)}function a(e){let t=e;t=t.replace(/<end_of_turn>/g,``),t=t.replace(/<start_of_turn>[\s\S]*/g,``),t=t.replace(/<\/model>/g,``),t=t.replace(/^Privane Browser AI Intelligence[:\s]*/im,``),t=t.replace(/^Privane Browser AI Intelligence research assistant[:\s]*/im,``);let n=t.split(`
`),r=[],a=null,s=[];function c(){if(s.length>0){let e=s.join(` `).trim();e&&r.push(`<p>`+o(i(e))+`</p>`),s=[]}}function l(){if(a){let e=a.type,t=`<`+e+`>`;for(let e of a.items)t+=`<li>`+o(i(e.trim()))+`</li>`;t+=`</`+e+`>`,r.push(t),a=null}}for(let e of n){let t=e.trim();if(!t){l(),c();continue}let n=t.match(/^[\*\-]\s+(.+)/);if(n&&!t.startsWith(`**`)){c(),(!a||a.type!==`ul`)&&(l(),a={type:`ul`,items:[]}),a.items.push(n[1]);continue}let u=t.match(/^\d+[\.\)]\s+(.+)/);if(u){c(),(!a||a.type!==`ol`)&&(l(),a={type:`ol`,items:[]}),a.items.push(u[1]);continue}if(t.startsWith(`> `)){c(),l(),r.push(`<div class="key-highlight">`+o(i(t.slice(2).trim()))+`</div>`);continue}let d=t.match(/^#{2,4}\s+(.+)/);if(d){c(),l(),r.push(`<p><strong>`+i(d[1].trim())+`</strong></p>`);continue}if(t.match(/^[-=_\*]{3,}$/)){c(),l(),r.push(`<hr/>`);continue}l(),s.push(t)}return l(),c(),r.join(``)}function o(e){return e=e.replace(/\*\*(.+?)\*\*/g,`<strong>$1</strong>`),e=e.replace(/\*([^\*]+?)\*/g,`<em>$1</em>`),e=e.replace(/`([^`]+?)`/g,`<code style="background:#F0F0F0;padding:1px 5px;border-radius:4px;font-size:13px;font-family:monospace;">$1</code>`),e}async function s(){let t=document.getElementById(`root`);if(!t)return;let n=document.createElement(`style`);n.textContent=e,document.head.appendChild(n),t.innerHTML=`<div class="loading-state"><div class="loading-spinner"></div><div class="loading-text">Loading research results...</div></div>`;let i=window.location.hash.slice(1);if(!i){t.innerHTML=`<div class="error-state">No research key found in URL.</div>`;return}try{let e=(await chrome.storage.local.get(i))[i];if(!e){t.innerHTML=`<div class="error-state">Research results not found. They may have been cleared.</div>`;return}r(e)}catch(e){t.innerHTML=`<div class="error-state">Failed to load research: `+(e.message||e)+`</div>`}}document.readyState===`loading`?document.addEventListener(`DOMContentLoaded`,s):s();