import Link from "next/link";
import styles from "./marketing.module.css";

const capabilities = [
  ["AI Workforce", "A managed team that handles calls, follow-up, booking, coordination and routine operations across the systems you already use."],
  ["Works with your stack", "Titan Zero upgrades the business you already have. It connects existing software and fills only the gaps that matter."],
  ["Human authority", "Consequential actions stay governed. Review, approve, reverse and progressively automate as trust is earned."],
  ["Private by design", "Use local models and customer-controlled providers where practical, with clear boundaries around business data and AI costs."],
];

export default function HomePage() {
  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <Link href="/" className={styles.brand}><span>T0</span><strong>TITAN ZERO<small>ADVANCED INTELLIGENCE FOR BUSINESS</small></strong></Link>
        <nav><Link href="/workforce">Workforce</Link><Link href="/assessment">Assessment</Link><a href="#how">How it works</a><Link href="/app" className={styles.cta}>Open Command →</Link></nav>
      </header>

      <section className={styles.hero}>
        <div className={styles.heroCopy}>
          <p className={styles.kicker}>MANAGED ADVANCED INTELLIGENCE</p>
          <h1>You don’t need to understand AI to employ an AI workforce.</h1>
          <p className={styles.lede}>Titan Zero installs and manages an intelligent workforce inside your existing business architecture—so you get more capacity, less admin and better operations without replacing the systems that already work.</p>
          <div className={styles.actions}><Link href="/workforce">Meet your workforce</Link><Link href="/assessment">Assess your business</Link></div>
          <div className={styles.proof}><span>Existing systems first</span><span>Company-controlled data</span><span>Governed automation</span></div>
        </div>
        <div className={styles.command}>
          <div className={styles.commandTop}><span>ZERO / COMMAND</span><i>LIVE</i></div>
          <div className={styles.chat}><small>YOU</small><p>What needs my attention today?</p></div>
          <div className={styles.chatAI}><small>TITAN ZERO</small><p>Three customer follow-ups are ready, tomorrow has a capacity gap, and I prepared two options. Nothing consequential has been executed without your authority.</p></div>
          <div className={styles.cards}><article><b>12</b><span>leads handled</span></article><article><b>3</b><span>decisions ready</span></article><article><b>4.8h</b><span>admin avoided</span></article></div>
        </div>
      </section>

      <section className={styles.strip}><span>CHAT</span><span>VOICE</span><span>CAMERA</span><span>GENERATIVE UI</span><span>LOCAL + CLOUD AI</span></section>

      <section className={styles.field}>
        <div>
          <p className={styles.kicker}>BUILT FOR WORK AWAY FROM THE DESK</p>
          <h2>Talk to the business while you’re doing the work.</h2>
          <p>Field teams should not have to stop working to feed an office system. Titan Zero turns voice, camera and quick field input into structured operational context your workforce can use.</p>
          <div className={styles.fieldList}>
            <span><b>VOICE</b> Capture job notes, site conditions and customer context without retyping them later.</span>
            <span><b>CAMERA</b> Give the system visual evidence for quoting, documentation and field support.</span>
            <span><b>GO</b> Put the worker experience in the pocket instead of shrinking an office dashboard onto a phone.</span>
          </div>
        </div>
        <div className={styles.phone}>
          <div className={styles.phoneTop}><span>TITAN GO</span><i>● LIVE</i></div>
          <small>ACTIVE JOB</small><h3>Capture what happened</h3>
          <div className={styles.voice}><b>VOICE CAPTURE</b><em>00:47</em><div>▂ ▅ ▇ ▃ ▆ █ ▅ ▂ ▇ ▄ ▆ ▃</div><p>Replaced unit, photographed installation and confirmed customer approval…</p></div>
          <button>Save + continue →</button>
        </div>
      </section>

      <section className={styles.section} id="workforce">
        <p className={styles.kicker}>YOUR TEAM, NOT ANOTHER DASHBOARD</p>
        <h2>An AI workforce that operates the business with you.</h2>
        <div className={styles.grid}>{capabilities.map(([title,body])=><article key={title}><span>0{capabilities.findIndex(x=>x[0]===title)+1}</span><h3>{title}</h3><p>{body}</p></article>)}</div><div className={styles.actions}><Link href="/workforce">Explore the AI workforce →</Link></div>
      </section>

      <section className={styles.operations}>
        <p className={styles.kicker}>FROM CONVERSATION TO OPERATION</p>
        <h2>Ask for the outcome. Titan Zero coordinates the work.</h2>
        <p className={styles.operationsLead}>Instead of hunting through menus, tell the workforce what needs to happen. Titan Zero can gather context, prepare the action and route consequential steps through the authority your business has set.</p>
        <div className={styles.operationGrid}>
          <article><b>01</b><h3>Capture</h3><p>Turn calls, voice notes, photos and customer conversations into usable business context.</p></article>
          <article><b>02</b><h3>Prepare</h3><p>Draft quotes, follow-ups, schedules, job updates and next actions from that context.</p></article>
          <article><b>03</b><h3>Coordinate</h3><p>Keep customers, field teams and office workflows aligned across the systems you already use.</p></article>
          <article><b>04</b><h3>Act with authority</h3><p>Execute approved work automatically where trust and business policy allow it.</p></article>
        </div>
      </section>

      <section className={styles.dark} id="system">
        <div><p className={styles.kicker}>BUILT FOR CONSEQUENCE</p><h2>Intelligence with boundaries.</h2><p>Titan Zero combines operational intelligence, decision support, governance and auditability. The system can observe, recommend, prepare and execute within the authority your business grants it.</p></div>
        <div className={styles.flow}><span>Observe</span><b>→</b><span>Recommend</span><b>→</b><span>Prepare</span><b>→</b><span>Approve</span><b>→</b><span>Automate</span></div>
      </section>

      <section className={styles.section} id="how">
        <p className={styles.kicker}>IMPLEMENTATION, NOT AI HOMEWORK</p>
        <h2>Keep your business. Upgrade its intelligence.</h2>
        <div className={styles.steps}><article><b>01</b><h3>Map</h3><p>We identify the expensive gaps, repetitive work and disconnected systems.</p></article><article><b>02</b><h3>Connect</h3><p>We connect Titan Zero to the tools you already use and add missing capabilities only where needed.</p></article><article><b>03</b><h3>Employ</h3><p>Your AI workforce begins under human supervision and earns greater autonomy through evidence and trust.</p></article><article><b>04</b><h3>Manage</h3><p>Titan Zero is maintained as an operating capability, not handed over as another piece of software to learn.</p></article></div>
      </section>

      <section className={styles.final}><p>ZERO BS. MORE BUSINESS.</p><h2>Put an intelligent workforce inside the business you already built.</h2><Link href="/app">Open Titan Zero Command →</Link></section>
      <footer><strong>TITAN ZERO</strong><span>Advanced Intelligence systems for real businesses.</span><span>Command · Go · Hub</span></footer>
    </main>
  );
}