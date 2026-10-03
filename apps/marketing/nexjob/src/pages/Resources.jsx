import { Link } from 'react-router-dom'
import PageMeta from '../components/PageMeta'
import SectionLabel from '../components/SectionLabel'

const cleaningGuides = [
  {
    id: 'scope-and-quote',
    category: 'Scope and pricing',
    title: 'Scope the clean before you quote',
    summary: 'A clear scope helps the customer understand what is included and gives the team a usable job brief.',
    steps: [
      'List the rooms, zones or surfaces, their condition, access details and any time window.',
      'Write the task and expected outcome for each area. Separate standard work from deep-clean tasks and optional extras.',
      'Choose a pricing approach: a defined fixed scope, or an hourly visit with a clear priority list and time limit.',
      'Record assumptions, exclusions, travel, supplies and equipment, plus how a requested change gets approved.',
    ],
    takeaway: 'Price from your business costs and agreed scope. There is no single cleaning rate that fits every property, service or crew.',
  },
  {
    id: 'residential-cleaning',
    category: 'Homes',
    title: 'Plan recurring, deep and end-of-lease cleans',
    summary: 'Use one property profile for repeat instructions, then make each booking clear about the service being delivered.',
    steps: [
      'Capture rooms, surfaces, access, pets, customer priorities and the preferred recurring schedule.',
      'State whether the visit is a maintenance clean, first or deep clean, or an end-of-lease service.',
      'List room-level tasks, agreed extras, fragile surfaces and exclusions before confirming the quote.',
      'After the visit, record incomplete tasks, approved variations and any follow-up the customer requested.',
    ],
    takeaway: 'Keep the agreed scope and property instructions available to the cleaner on every visit.',
  },
  {
    id: 'short-stay-turnover',
    category: 'Airbnb and short stays',
    title: 'Make turnovers ready for the next guest',
    summary: 'Separate stable property instructions from booking-specific changes so each turnover has the right context.',
    steps: [
      'Maintain a property setup card for access, room priorities, bed sizes, linen locations, supplies and known issues.',
      'Check the booking’s guest count, arrival deadline, requested changes and any owner notes.',
      'Start laundry early, check clean linen and backup stock, and flag missing consumables before the final room pass.',
      'Plan backwards from guest arrival with a realistic buffer for laundry, repairs or a second cleaner.',
      'Finish with a guest-view check of beds, bathrooms, kitchen, rubbish and visible surfaces; record exceptions and agreed photos.',
    ],
    takeaway: 'Use a clear ready-to-host sign-off and escalate damage, missing stock or late access instead of silently marking the property ready.',
  },
  {
    id: 'commercial-cleaning',
    category: 'Offices and commercial',
    title: 'Build a site-specific cleaning plan',
    summary: 'A commercial plan should describe the actual premises, service standard and operating conditions.',
    steps: [
      'Walk the site and divide it into named zones such as entry, work areas, amenities, kitchen and meeting rooms.',
      'For each zone, specify the task, expected outcome, visit frequency or trigger, and any periodic work.',
      'Record access windows, alarms, lifts, restricted areas, site contacts, consumables and who supplies equipment.',
      'Agree how service quality is checked, how a missed task is reported and who signs off changes.',
      'Review the plan after a trial period using site use, actual soil and customer feedback; adjust the agreed schedule as needed.',
    ],
    takeaway: 'Keep periodic deep work separate from routine visits so both the client and team know what is due.',
  },
  {
    id: 'builders-handover',
    category: 'Construction and handover',
    title: 'Plan post-construction cleaning in stages',
    summary: 'Match the clean to the site stage and the authorised access conditions.',
    steps: [
      'Confirm whether the request is a rough clean during works, a builders clean after trades, a final presentation pass, or a return clean after defects work.',
      'Agree which rooms, surfaces, residues and waste categories are in scope, and identify delicate finishes and exclusions.',
      'Confirm site contact, induction, access hours, other trades, required equipment and the site controller’s hazard controls before work starts.',
      'Record completed areas and visible exceptions with notes or photos when appropriate, then send the agreed handover summary.',
    ],
    takeaway: 'A cleaning photo record documents observations; it is not a certified building inspection or proof that construction defects are absent.',
  },
  {
    id: 'cleaner-induction-quality',
    category: 'People and quality',
    title: 'Give cleaners a usable job brief',
    summary: 'A good handover puts task outcomes, site conditions and escalation paths in one place.',
    steps: [
      'Confirm the worker has the role, site access and task-specific training required for the assigned work.',
      'Show the service scope, sequence, customer preferences, supplies, equipment and any surface or access limits.',
      'Explain how to report an incident, a missing item, a task that cannot be completed or a customer-requested variation.',
      'Close the job with the agreed checklist, time and materials record, exception notes and completion evidence.',
      'Route rework or a complaint for review and keep the correction linked to the original visit.',
    ],
    takeaway: 'Do not ask a cleaner to improvise a new scope or use an unfamiliar chemical or machine without the right instructions and controls.',
  },
]

const planningTemplates = [
  {
    title: 'Service scope and quote worksheet',
    description: 'Capture enough detail to prepare and deliver a consistent quote.',
    fields: ['Customer and site', 'Rooms, zones or surfaces', 'Task and outcome', 'Frequency or trigger', 'Access and time window', 'Supplies and equipment', 'Inclusions and exclusions', 'Price method and approval'],
  },
  {
    title: 'Short-stay property and turnover card',
    description: 'Keep property setup separate from the changes attached to a particular booking.',
    fields: ['Access and property notes', 'Beds, linen and backup stock', 'Consumable minimums', 'Guest count and arrival deadline', 'Laundry and task sequence', 'Damage or missing items', 'Final guest-ready check', 'Photo and sign-off requirements'],
  },
  {
    title: 'Commercial site and quality plan',
    description: 'Turn a walkthrough into a service schedule the client and team can review.',
    fields: ['Site and contact', 'Named zones', 'Task standard by zone', 'Frequency and periodic work', 'Access and security', 'Consumables and equipment owner', 'Quality check and sign-off', 'Variation and escalation path'],
  },
]

const officialReferences = [
  {
    authority: 'WorkSafe Victoria',
    scope: 'Victoria regulator guidance',
    title: 'Cleaning industry injury hotspots',
    description: 'Cleaning-specific material on common injury risks, including chemical handling, cuts and handling equipment or waste.',
    href: 'https://www.worksafe.vic.gov.au/injury-hotspots-cleaning',
  },
  {
    authority: 'Safe Work Australia',
    scope: 'National model code; check local adoption',
    title: 'Managing risks of hazardous chemicals',
    description: 'Model workplace guidance on chemical registers, labels, safety data sheets and risk controls. Check the relevant state or territory regulator for local legal effect.',
    href: 'https://www.safeworkaustralia.gov.au/doc/model-code-practice-managing-risks-hazardous-chemicals-workplace',
  },
  {
    authority: 'Fair Work Ombudsman',
    scope: 'Official award information',
    title: 'Cleaning Services Award summary',
    description: 'Check coverage and use the official pay and conditions tools. Confirm the right award and classification for the specific employment arrangement.',
    href: 'https://www.fairwork.gov.au/employment-conditions/awards/awards-summary/ma000022-summary',
    secondaryHref: 'https://awards.fairwork.gov.au/MA000022.html',
    secondaryLabel: 'Read the current award text',
  },
]

const productGuides = [
  ['Cleaning system features', '/features', 'CRM, quotes, bookings, scheduling, jobs, evidence, invoices, equipment and customer care.'],
  ['AI workforce', '/ai-workforce', 'The six specialist roles supporting a cleaning operation.'],
  ['AI Reception', '/reception', 'Explore the reception and booking workflow.'],
  ['Omnichannel marketing', '/marketing', 'See the marketing system and supported workflow plans.'],
  ['Lead generation', '/lead-generation', 'Explore lead research and business development workflows.'],
  ['WordPress plugins', '/wordpress-plugins', 'Five separate products for cleaning business workflows.'],
  ['Chrome extensions', '/chrome-extensions', 'Five separate browser products for cleaning business workflows.'],
  ['Works Everywhere', '/works-everywhere', 'Mobile, PWA, ChatGPT and messaging channel information.'],
  ['What is Titan Zero?', '/titan-zero', 'How the workforce and business system are coordinated.'],
  ['Frequently asked questions', '/faq', 'Answers about setup, channels, safety, AI Assist and plans.'],
  ['Managed service', '/fully-managed', 'Implementation and ongoing system management for cleaning businesses.'],
]

function GuideCard({ guide }) {
  return (
    <article id={guide.id} className="scroll-mt-24 rounded-2xl border border-nx-border bg-nx-surface p-6">
      <p className="mb-3 text-xs font-bold uppercase tracking-[0.12em] text-nx-purple-light">{guide.category}</p>
      <h3 className="mb-3 text-xl font-bold">{guide.title}</h3>
      <p className="mb-5 text-sm leading-relaxed text-nx-muted">{guide.summary}</p>
      <ol className="list-decimal space-y-2 pl-5 text-sm leading-relaxed text-nx-muted">
        {guide.steps.map((step) => <li key={step}>{step}</li>)}
      </ol>
      <p className="mt-5 border-t border-nx-border pt-4 text-sm leading-relaxed text-nx-text">
        <span className="font-semibold">Keep in mind: </span>{guide.takeaway}
      </p>
    </article>
  )
}

export default function Resources() {
  return (
    <>
      <PageMeta
        title="Cleaning Business Resources | Titan Zero"
        description="Australian cleaning business guides and planning templates for residential, Airbnb, commercial and post-construction cleaning."
      />
      <main id="top" className="pb-24">
        <section className="px-6 pb-12 pt-32">
          <div className="mx-auto max-w-6xl">
            <SectionLabel>Australian cleaning business toolkit</SectionLabel>
            <h1 className="mb-5 max-w-4xl text-4xl font-extrabold sm:text-5xl">Practical resources for cleaner jobs and stronger operations.</h1>
            <p className="max-w-3xl text-lg leading-relaxed text-nx-muted">
              Use these original guides and planning prompts to scope work, prepare cleaner handovers and set quality expectations across homes, short stays, offices and handover cleans.
            </p>
            <nav aria-label="Resource sections" className="mt-8 flex flex-wrap gap-3">
              {[
                ['Cleaning guides', '#cleaning-guides'],
                ['Planning templates', '#planning-templates'],
                ['Australian sources', '#australian-sources'],
                ['Titan Zero product guides', '#product-guides'],
              ].map(([label, href]) => (
                <a key={href} href={href} className="rounded-lg border border-nx-border px-4 py-2 text-sm font-semibold text-nx-muted hover:border-nx-purple hover:text-nx-text">
                  {label}
                </a>
              ))}
            </nav>
            <p className="mt-4 text-xs text-nx-muted2">Guides are general operating prompts. Adapt each scope and checklist to the site, contract and approved services.</p>
          </div>
        </section>

        <section id="cleaning-guides" aria-labelledby="cleaning-guides-title" className="border-y border-nx-border bg-nx-surface/30 px-6 py-16 scroll-mt-20">
          <div className="mx-auto max-w-6xl">
            <div className="mb-10 max-w-3xl">
              <SectionLabel>Cleaning work</SectionLabel>
              <h2 id="cleaning-guides-title" className="mb-4 text-3xl font-extrabold sm:text-4xl">Guides for the work your business delivers.</h2>
              <p className="leading-relaxed text-nx-muted">Start with the service scope, then carry the property or site details through the booking, cleaner handover and close-out.</p>
            </div>
            <div className="grid gap-4 lg:grid-cols-2">
              {cleaningGuides.map((guide) => <GuideCard key={guide.id} guide={guide} />)}
            </div>
          </div>
        </section>

        <section id="planning-templates" aria-labelledby="planning-templates-title" className="px-6 py-16 scroll-mt-20">
          <div className="mx-auto max-w-6xl">
            <div className="mb-10 max-w-3xl">
              <SectionLabel>Planning templates</SectionLabel>
              <h2 id="planning-templates-title" className="mb-4 text-3xl font-extrabold sm:text-4xl">Useful fields for your own forms and checklists.</h2>
              <p className="leading-relaxed text-nx-muted">These starter fields are designed to be copied into a business’s own document or workflow and adjusted to the service agreement.</p>
            </div>
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {planningTemplates.map((template) => (
                <article key={template.title} className="rounded-2xl border border-nx-border bg-nx-surface p-6">
                  <h3 className="mb-2 text-lg font-bold">{template.title}</h3>
                  <p className="mb-4 text-sm leading-relaxed text-nx-muted">{template.description}</p>
                  <ul className="space-y-2 text-sm text-nx-muted">
                    {template.fields.map((field) => <li key={field} className="flex gap-2"><span aria-hidden="true" className="text-nx-purple-light">•</span><span>{field}</span></li>)}
                  </ul>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section id="australian-sources" aria-labelledby="australian-sources-title" className="border-y border-nx-border bg-nx-surface/30 px-6 py-16 scroll-mt-20">
          <div className="mx-auto max-w-6xl">
            <div className="mb-10 max-w-3xl">
              <SectionLabel>Australian reference links</SectionLabel>
              <h2 id="australian-sources-title" className="mb-4 text-3xl font-extrabold sm:text-4xl">Check current guidance with the responsible source.</h2>
              <p className="leading-relaxed text-nx-muted">Australian requirements can differ by state or territory, work activity and worker arrangement. These links are starting points; confirm the current rules for your situation.</p>
            </div>
            <div className="grid gap-4 lg:grid-cols-3">
              {officialReferences.map((reference) => (
                <article key={reference.title} className="rounded-2xl border border-nx-border bg-nx-bg p-6">
                  <p className="mb-2 text-xs font-bold uppercase tracking-[0.12em] text-nx-purple-light">{reference.authority}</p>
                  <p className="mb-3 text-xs text-nx-muted2">{reference.scope}</p>
                  <h3 className="mb-2 text-lg font-bold">{reference.title}</h3>
                  <p className="mb-5 text-sm leading-relaxed text-nx-muted">{reference.description}</p>
                  <a href={reference.href} target="_blank" rel="noreferrer" className="text-sm font-semibold text-nx-purple-light hover:text-white">
                    Open official resource ↗
                  </a>
                  {reference.secondaryHref && (
                    <p className="mt-3">
                      <a href={reference.secondaryHref} target="_blank" rel="noreferrer" className="text-sm text-nx-muted hover:text-nx-text">
                        {reference.secondaryLabel} ↗
                      </a>
                    </p>
                  )}
                </article>
              ))}
            </div>
            <p className="mt-6 text-xs leading-relaxed text-nx-muted2">Sources checked 4 October 2026. Safe Work Australia model codes are not a substitute for checking the relevant jurisdiction’s regulator. This page is general information, not legal, employment or safety advice.</p>
          </div>
        </section>

        <section id="product-guides" aria-labelledby="product-guides-title" className="px-6 py-16 scroll-mt-20">
          <div className="mx-auto max-w-6xl">
            <div className="mb-10 max-w-3xl">
              <SectionLabel>Titan Zero</SectionLabel>
              <h2 id="product-guides-title" className="mb-4 text-3xl font-extrabold sm:text-4xl">Explore the cleaning workforce and system.</h2>
              <p className="leading-relaxed text-nx-muted">Product pages explain how Titan Zero is designed to connect cleaning enquiries, quotes, bookings, field work and customer follow-up.</p>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {productGuides.map(([label, href, description]) => (
                <Link key={href} to={href} className="rounded-xl border border-nx-border bg-nx-surface p-6 hover:border-nx-purple">
                  <h3 className="mb-2 font-bold">{label} →</h3>
                  <p className="text-sm leading-relaxed text-nx-muted">{description}</p>
                </Link>
              ))}
            </div>
          </div>
        </section>

        <section className="px-6">
          <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-5 border-t border-nx-border pt-8">
            <div>
              <SectionLabel>Put the workflow to work</SectionLabel>
              <h2 className="text-2xl font-bold">See how the system supports a cleaning operation.</h2>
            </div>
            <div className="flex flex-wrap gap-5">
              <Link to="/features" className="text-sm font-semibold text-nx-purple-light hover:text-white">Explore features →</Link>
              <Link to="/fully-managed" className="text-sm font-semibold text-nx-purple-light hover:text-white">Managed service →</Link>
            </div>
          </div>
        </section>
      </main>
    </>
  )
}
