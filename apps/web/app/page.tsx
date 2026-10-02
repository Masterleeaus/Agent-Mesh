import Link from "next/link";
import styles from "./marketing.module.css";

const IMG = "https://raw.githubusercontent.com/Masterleeaus/Titan-Zero-Field-Service-Workforce/main/docs/images";

const capabilities = [
  ["Cleaning setup", "Choose supported cleaning services, set your own prices and configure where and when your team works."],
  ["Scope and visits", "Keep property details, agreed service scope, scheduled visits and native job records together."],
  ["Checklists and evidence", "Give cleaners a clear visit checklist and keep completion notes and evidence with the job."],
  ["Owner-controlled actions", "Review quotes, schedules and consequential changes through the business's existing authority path."],
];

const graphicStyle = { width: "100%", height: "auto", display: "block", borderRadius: "14px" } as const;
const graphicSectionStyle = { maxWidth: "1380px", margin: "0 auto", padding: "32px 28px 72px" } as const;

export default function HomePage() {
  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <Link href="/" className={styles.brand}><span>T0</span><strong>TITAN ZERO<small>ADVANCED INTELLIGENCE FOR BUSINESS</small></strong></Link>
        <nav><Link href="/workforce">Workforce</Link><Link href="/assessment">Assessment</Link><a href="#how">How it works</a><Link href="/app" className={styles.cta}>Open Command →</Link></nav>
      </header>

      <section style={{ maxWidth: "520px", margin: "0 auto", padding: "54px 28px 0" }}>
        <img src={`${IMG}/CB4FE4C8-1FF9-4228-8DAC-98FED23D43A3.png`} alt="Titan Zero Field Service Workforce" style={graphicStyle} />
      </section>

      <section className={styles.hero}>
        <div className={styles.heroCopy}>
          <p className={styles.kicker}>CLEANING WORK, CLEARLY COORDINATED</p>
          <h1>Run your cleaning work with less admin and clearer records.</h1>
          <p className={styles.lede}>Set up the cleaning services your company offers, configure your own prices and service areas, then coordinate jobs, visits and completion records through Titan's existing native field-service workflows.</p>
          <div className={styles.actions}><Link href="/workforce">See cleaning workflows</Link><Link href="/assessment">Assess your cleaning operations</Link></div>
          <div className={styles.proof}><span>Company-configured services</span><span>Prices set by your business</span><span>Governed operations</span></div>
        </div>
        <div className={styles.command}>
          <div className={styles.commandTop}><span>CLEANING / OPERATIONS</span><i>EXAMPLE</i></div>
          <div className={styles.chat}><small>YOU</small><p>What should I review before tomorrow’s cleans?</p></div>
          <div className={styles.chatAI}><small>TITAN ZERO</small><p>Check the visit scope, confirm access details and review any items the team flagged. The records stay with their company and job.</p></div>
          <div className={styles.cards}><article><b>Scope</b><span>confirm service</span></article><article><b>Visit</b><span>check access</span></article><article><b>Review</b><span>resolve exceptions</span></article></div>
        </div>
      </section>

      <section style={graphicSectionStyle}>
        <img src={`${IMG}/F2BED790-8EF0-473B-988E-F42E9488B1AE.png`} alt="Titan Zero field service workforce operating model" style={graphicStyle} />
      </section>

      <section className={styles.strip}><span>CHAT</span><span>VOICE</span><span>CAMERA</span><span>GENERATIVE UI</span><span>LOCAL + CLOUD AI</span></section>

      <section className={styles.field}>
        <div>
          <p className={styles.kicker}>BUILT FOR WORK AWAY FROM THE DESK</p>
          <h2>Keep the cleaning visit moving.</h2>
          <p>Field teams can record agreed tasks, property access details and visit exceptions as work happens, keeping the job record useful to the office and the next visit.</p>
          <div className={styles.fieldList}>
            <span><b>NOTES</b> Record the service scope completed and issues that need owner review.</span>
            <span><b>EVIDENCE</b> Keep checklist completion and relevant photos with the visit record.</span>
            <span><b>FIELD</b> Put the assigned cleaning visit and its instructions where the team works.</span>
          </div>
        </div>
        <div className={styles.phone}>
          <div className={styles.phoneTop}><span>TITAN GO</span><i>EXAMPLE</i></div>
          <small>CLEANING VISIT</small><h3>Record the visit outcome</h3>
          <div className={styles.voice}><b>VISIT NOTE</b><em>CHECKLIST</em><div>Kitchen · bathrooms · floors</div><p>Record completed items and flag any access or condition exceptions for review.</p></div>
          <button>Save + continue →</button>
        </div>
      </section>

      <section className={styles.section} id="workforce">
        <p className={styles.kicker}>YOUR TEAM, NOT ANOTHER DASHBOARD</p>
        <h2>A cleaning workforce that keeps service work connected.</h2>
        <div className={styles.grid}>{capabilities.map(([title,body])=><article key={title}><span>0{capabilities.findIndex(x=>x[0]===title)+1}</span><h3>{title}</h3><p>{body}</p></article>)}</div><div className={styles.actions}><Link href="/workforce">Explore the AI workforce →</Link></div>
      </section>

      <section style={graphicSectionStyle}>
        <img src={`${IMG}/4FE3482C-D943-4405-86CF-143AAFEF52C5.png`} alt="Titan Zero Field Service Workforce system architecture" style={graphicStyle} />
      </section>

      <section className={styles.operations}>
        <p className={styles.kicker}>FROM CLEANING REQUEST TO VISIT RECORD</p>
        <h2>Keep each cleaning job connected from scope to completion.</h2>
        <p className={styles.operationsLead}>Use the existing company configuration and native job, visit and checklist records. Owners remain responsible for configured prices and consequential decisions.</p>
        <div className={styles.operationGrid}>
          <article><b>01</b><h3>Set the service</h3><p>Choose a supported cleaning job type and record the company's configured pricing mode and amount.</p></article>
          <article><b>02</b><h3>Prepare the job</h3><p>Keep the property, agreed scope and exclusions with the existing job record.</p></article>
          <article><b>03</b><h3>Coordinate the visit</h3><p>Use native scheduling and visit records to keep the office and cleaning team aligned.</p></article>
          <article><b>04</b><h3>Record completion</h3><p>Complete the selected checklist and retain the visit's evidence and exceptions.</p></article>
        </div>
      </section>

      <section className={styles.dark} id="system">
        <div><p className={styles.kicker}>BUILT FOR CONSEQUENCE</p><h2>Intelligence with boundaries.</h2><p>Titan Zero combines operational intelligence, decision support, governance and auditability. The system can observe, recommend, prepare and execute within the authority your business grants it.</p></div>
        <div className={styles.flow}><span>Observe</span><b>→</b><span>Recommend</span><b>→</b><span>Prepare</span><b>→</b><span>Approve</span><b>→</b><span>Automate</span></div>
      </section>

      <section className={styles.section} id="how">
        <p className={styles.kicker}>CLEANING SETUP AND OPERATIONS</p>
        <h2>Start with the services your company is ready to deliver.</h2>
        <div className={styles.steps}><article><b>01</b><h3>Select</h3><p>Choose from the cleaning job types supported by the existing cleaning workforce bundle.</p></article><article><b>02</b><h3>Configure</h3><p>Set your service areas, working hours and prices. Fixed prices and hourly rates must come from your company.</p></article><article><b>03</b><h3>Coordinate</h3><p>Use native company jobs, schedules and visits to coordinate each cleaning service.</p></article><article><b>04</b><h3>Record</h3><p>Keep checklist completion, evidence and exceptions with the visit for the existing review flow.</p></article></div>
      </section>

      <section className={styles.final}><p>CLEANING FIRST. OWNER CONTROLLED.</p><h2>Coordinate the cleaning work your company is set up to deliver.</h2><Link href="/app">Open Titan Zero →</Link></section>
      <footer><strong>TITAN ZERO</strong><span>Cleaning-first field-service operations.</span><span>Command · Go · Hub</span></footer>
    </main>
  );
}
