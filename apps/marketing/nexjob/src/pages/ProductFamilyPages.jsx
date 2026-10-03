import { Link } from 'react-router-dom'
import PageMeta from '../components/PageMeta'
import SectionLabel from '../components/SectionLabel'

const productAreas = [
  {
    id: 'bookings',
    name: 'Bookings',
    wordpress: 'Collect cleaning service requests, property and room details, access needs, preferred times and recurring preferences. Booking availability and staff/resource selection remain governed by configured business rules.',
    chrome: 'Turn an approved page or conversation into a draft cleaning request. Review property, service, access and timing details, then pass the request to the canonical booking workflow for availability checks and any required approval.',
    ai: 'Interprets enquiries, extracts service, property and timing details, flags missing information, and drafts customer responses. Availability and booking decisions stay rule-based and authorised.',
  },
  {
    id: 'invoicing',
    name: 'Invoicing',
    wordpress: 'Prepare invoices, receipts, credits and refunds, and track payment status and reconciliation. Present configured payment choices such as PayID, bank transfer, cash and optional card or gateway methods.',
    chrome: 'Review the current approved invoice or payment context and prepare a follow-up or reconciliation task. Financial changes must use the canonical invoice/payment capability and its required authority checks.',
    ai: 'Extracts details from approved records, drafts payment reminders, and explains invoice status. It does not invent totals or mark a payment as received.',
  },
  {
    id: 'job-management',
    name: 'Job Management',
    wordpress: 'Manage work orders, assignments, status, tasks and checklists, time and materials, photos and evidence, and customer-facing job updates.',
    chrome: 'Capture approved job context from supported business pages, find the related work item, and prepare a follow-up or status action. The shared job system remains the source of business records.',
    ai: 'Summarises job notes, drafts checklist or customer-update text, and highlights exceptions. It cannot create evidence or grant authority to mark work complete.',
  },
  {
    id: 'quotes',
    name: 'Quotes',
    wordpress: 'Prepare service scopes, line items and transparent options; track revisions, customer acceptance or rejection, signatures and related documents. Service tiers and payment-term choices remain separate settings.',
    chrome: 'Extract relevant details from an approved enquiry page and draft a quote for review. The quote remains a proposal until the authorised person or configured workflow accepts it.',
    ai: 'Clarifies scope and drafts quote descriptions or options. Pricing calculations and quote acceptance remain governed by business rules and authority.',
  },
  {
    id: 'crm',
    name: 'CRM',
    wordpress: 'Keep CRM-lite customer, company and contact records, locations and assets, notes, history, custom fields and repeat-work context together with the service workflow.',
    chrome: 'Capture approved customer, contact and location details from a supported page, check the existing business context, and prepare a CRM update or follow-up for review.',
    ai: 'Extracts contact details from approved context, summarises relationship history, and drafts follow-ups. Identity matching and record changes remain controlled by the CRM workflow.',
  },
]

const pageContent = {
  wordpress: {
    title: 'WordPress Plugins for Cleaning Businesses',
    description: 'Explore five planned Titan Zero WordPress product modules for cleaning bookings, invoicing, job management, quotes and CRM, with optional AI Assist.',
    eyebrow: 'WordPress product family · planned',
    heading: 'Five focused tools for the cleaning business workflow.',
    intro: 'The planned Titan Zero WordPress family brings bookings, invoicing, job management, quotes and CRM together through one reusable service-business engine. Each product area can use AI Assist, while the core workflow remains useful without AI.',
    platformHeading: 'Choose how the WordPress site connects.',
    platformSteps: [
      ['Standalone · local-first', 'The WordPress installation owns its local customer and operational records, authentication and core workflow. Use local or bring-your-own AI providers if wanted; Titan-hosted inference is not required for the standalone workflow.'],
      ['Connected Titan', 'After an explicit connection, Titan company identity, canonical business capabilities, Workforce, authority and evidence remain authoritative. WordPress acts as the customer-facing adapter and may provide permitted cache or offline behaviour without creating a second source of truth.'],
    ],
    assistHeading: 'AI helps with language work; business rules stay deterministic.',
    assist: 'AI Assist can interpret enquiries, extract details, draft quotes and messages, summarise job history and recommend next steps. Calculations, availability, payment rules, permissions and workflow state are handled by deterministic business logic. AI can be turned off without disabling the core workflow. Managed Titan AI and Premium Knowledge/RAG are optional.',
    close: 'These are planned product modules, not five released downloads. No WordPress.org package or live Titan connection is available from this review site.',
  },
  chrome: {
    title: 'Chrome Extensions for Cleaning Teams',
    description: 'Explore five planned Titan Zero Chrome product profiles for cleaning bookings, invoicing, job management, quotes and CRM, with governed AI Assist.',
    eyebrow: 'Chrome product family · planned',
    heading: 'Cleaning business assistance in the browser.',
    intro: 'The planned Chrome family brings five focused work areas—Bookings, Invoicing, Job Management, Quotes and CRM—into a persistent browser side panel. They are profiles over one shared Browser Node, not five duplicated business engines.',
    platformHeading: 'A governed path from page context to business work.',
    platformSteps: [
      ['Capture with boundaries', 'On supported websites, the Browser Node reads only approved page context. Local extraction and redaction happen first where available, and only the minimum necessary context is sent to an enabled intelligence provider.'],
      ['Prepare, review and verify', 'AI can prepare a booking, quote, job, invoice or CRM action. The applicable business authority still controls consequential changes; the extension rereads the target or canonical record and records verification rather than treating a click as proof of success.'],
    ],
    assistHeading: 'Ask Zero about the page and prepare the next step.',
    assist: 'AI Assist can summarise approved page context, extract customer or service details, draft a quote or message, and suggest a relevant booking, job, invoice or CRM action. Local or bring-your-own models may be used where supported. Browser access is bounded and revocable, and model output does not grant business authority.',
    close: 'These are planned Chrome product profiles. No Chrome Web Store package or live extension is available from this review site.',
  },
}

function ProductFamilyLanding({ platform }) {
  const content = pageContent[platform]
  const isWordPress = platform === 'wordpress'
  const otherPath = isWordPress ? '/chrome-extensions' : '/wordpress-plugins'
  const otherLabel = isWordPress ? 'See Chrome extensions' : 'See WordPress plugins'

  return <>
    <PageMeta title={content.title} description={content.description} />
    <main>
      <section className="relative pt-32 pb-16 px-6 overflow-hidden">
        <div className="absolute -top-48 left-1/2 -translate-x-1/2 w-[800px] h-[800px] hero-glow pointer-events-none" />
        <div className="relative z-10 max-w-5xl mx-auto text-center">
          <SectionLabel>{content.eyebrow}</SectionLabel>
          <h1 className="text-4xl sm:text-6xl font-extrabold mb-5">{content.heading}</h1>
          <p className="text-lg text-nx-muted max-w-3xl mx-auto leading-relaxed">{content.intro}</p>
          <p className="inline-flex mt-6 rounded-full border border-amber-300/30 bg-amber-950/40 px-4 py-2 text-xs font-semibold text-amber-100">Planned · not available to install</p>
        </div>
      </section>

      <section className="px-6 pb-20">
        <div className="max-w-6xl mx-auto grid md:grid-cols-2 xl:grid-cols-3 gap-5">
          {productAreas.map((product, index) => <article key={product.id} className="bg-nx-surface border border-nx-border rounded-2xl p-7">
            <div className="flex items-center justify-between gap-3 mb-5"><span className="text-xs font-bold text-nx-purple-light">PRODUCT AREA {String(index + 1).padStart(2, '0')}</span><span className="rounded-full border border-nx-border px-3 py-1 text-[11px] text-nx-muted">Planned</span></div>
            <h2 className="text-2xl font-bold mb-3">Titan Zero {product.name}</h2>
            <p className="text-sm text-nx-muted leading-relaxed mb-5">{isWordPress ? product.wordpress : product.chrome}</p>
            <p className="border-t border-nx-border pt-4 text-xs text-nx-muted"><strong className="text-nx-text">AI Assist:</strong> {product.ai}</p>
          </article>)}
        </div>
      </section>

      <section className="px-6 py-20 border-y border-nx-border bg-nx-surface/40">
        <div className="max-w-6xl mx-auto">
          <SectionLabel>AI Assist</SectionLabel>
          <h2 className="text-3xl sm:text-4xl font-extrabold mb-5">{content.assistHeading}</h2>
          <p className="text-nx-muted leading-relaxed max-w-4xl">{content.assist}</p>
          <div className="mt-8 grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {['Interpret requests', 'Extract details', 'Draft work for review', 'Summarise and recommend'].map((item) => <div key={item} className="border border-nx-border rounded-xl p-4 text-sm font-medium">{item}</div>)}
          </div>
        </div>
      </section>

      <section className="px-6 py-20">
        <div className="max-w-6xl mx-auto">
          <SectionLabel>{isWordPress ? 'Operating modes' : 'Browser workflow'}</SectionLabel>
          <h2 className="text-3xl sm:text-4xl font-extrabold mb-8">{content.platformHeading}</h2>
          <div className="grid md:grid-cols-2 gap-5">
            {content.platformSteps.map(([title, description], index) => <article key={title} className="border-t border-nx-border pt-6">
              <p className="text-xs font-bold text-nx-purple-light mb-3">{String(index + 1).padStart(2, '0')}</p>
              <h3 className="text-xl font-bold mb-3">{title}</h3>
              <p className="text-sm text-nx-muted leading-relaxed">{description}</p>
            </article>)}
          </div>
          <p className="mt-9 rounded-2xl border border-nx-border bg-nx-surface p-6 text-sm text-nx-muted leading-relaxed">{content.close}</p>
        </div>
      </section>

      <section className="px-6 pb-24">
        <div className="max-w-6xl mx-auto flex flex-wrap gap-5 border-t border-nx-border pt-7">
          <Link to="/works-everywhere" className="text-sm font-semibold text-nx-purple-light hover:text-white">Check release status →</Link>
          <Link to={otherPath} className="text-sm font-semibold text-nx-purple-light hover:text-white">{otherLabel} →</Link>
          <Link to="/fully-managed" className="text-sm font-semibold text-nx-purple-light hover:text-white">Managed service →</Link>
        </div>
      </section>
    </main>
  </>
}

export function WordPressPlugins() {
  return <ProductFamilyLanding platform="wordpress" />
}

export function ChromeExtensions() {
  return <ProductFamilyLanding platform="chrome" />
}
