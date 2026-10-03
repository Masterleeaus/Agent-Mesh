import { Link } from 'react-router-dom'
import PageMeta from '../components/PageMeta'
import SectionLabel from '../components/SectionLabel'
import { ButtonPrimary } from '../components/Button'
import { APP_SIGNUP_AVAILABLE, appRoutes } from '../config'

const productAreas = [
  {
    id: 'bookings',
    name: 'Bookings',
    wordpress: 'Collect service requests with property, room or site details, access requirements, preferred times and recurring preferences. Confirmed bookings use the company’s configured availability and staffing rules.',
    chrome: 'Turn an approved website enquiry into a structured cleaning request. Check the service, property, access and timing details, fill gaps, then send it into the booking workflow for availability review.',
    ai: 'Interprets enquiries, extracts service and property details, flags missing information and drafts customer replies. The configured booking rules decide availability.',
  },
  {
    id: 'invoicing',
    name: 'Invoicing',
    wordpress: 'Prepare invoices, receipts, credits and refunds from approved work records. Track payment status and reconciliation, and present the business’s enabled methods such as PayID, bank transfer, cash or card.',
    chrome: 'Review invoice and payment context while working in supported business pages. Prepare a reminder or reconciliation task, then send it through the authorised finance workflow.',
    ai: 'Summarises approved records, drafts payment reminders and explains invoice status. It does not invent totals or mark a payment received.',
  },
  {
    id: 'job-management',
    name: 'Job Management',
    wordpress: 'Manage work orders, assignments, job status, visit tasks, room or site checklists, time, materials, photos, evidence and customer-facing updates.',
    chrome: 'Open the relevant work item from supported business context, review assignment and visit details, and prepare a status update or follow-up for the team.',
    ai: 'Summarises job notes, drafts customer updates and highlights checklist gaps or exceptions. Completion follows the required checklist and accepted evidence.',
  },
  {
    id: 'quotes',
    name: 'Quotes',
    wordpress: 'Build service scopes and line items, keep quote revisions together, and record customer acceptance, rejection, signatures and related documents. Fixed, hourly and quote-required pricing are configured by the business.',
    chrome: 'Extract service, property and customer details from an approved enquiry page and prepare a quote draft for review before it enters the canonical quote workflow.',
    ai: 'Clarifies service scope and drafts descriptions or options. Configured prices, calculations, capacity and quote acceptance remain governed by business rules.',
  },
  {
    id: 'crm',
    name: 'CRM',
    wordpress: 'Keep prospects, customers, companies, contacts, locations, properties, assets, notes, custom fields and service history connected. Import lists, review duplicates and retain source, consent and opt-out context.',
    chrome: 'Capture approved customer, contact or location details from a supported page, check existing records and prepare a CRM update or follow-up for review.',
    ai: 'Extracts details from approved page context, summarises relationship history and drafts follow-up. Identity matching, consent and record changes stay in the CRM workflow.',
  },
]

const pageContent = {
  wordpress: {
    title: 'Cleaning WordPress Plugins',
    description: 'Five separate WordPress plugins for cleaning bookings, invoicing, job management, quotes and CRM, with AI Assist and connected Titan Zero workflows.',
    eyebrow: 'Five WordPress plugins for Cleaning',
    heading: 'The cleaning workflow, inside your WordPress site.',
    intro: 'Choose the focused plugins your business needs. Each product installs separately, and each can use AI Assist for the language work around cleaning operations.',
    installLabel: 'Get WordPress plugins',
    installText: 'Create your account to download the individual plugin packages and follow the connection steps. Use the plugins independently for a local WordPress workflow, or connect them to the Cleaning system so approved records and actions stay in sync.',
    platformHeading: 'Start locally or connect the business workflow.',
    platformSteps: [
      ['WordPress workflow', 'Manage the plugin’s customer-facing forms and local WordPress records with WordPress authentication and storage. Use AI Assist when configured; the everyday workflow remains available without it.'],
      ['Connected Cleaning system', 'Connect the site to the company workspace so Titan Zero’s Cleaning workforce and canonical business records remain the source for approved customer, quote, booking, job and payment actions.'],
    ],
    assistHeading: 'AI Assist for the work around the workflow.',
    assist: 'AI Assist interprets service requests, extracts details, drafts quotes and messages, summarises job history and suggests the next step. It does not set prices, promise availability, approve a quote, prove job completion or record a payment. Turn AI off and the core WordPress workflow remains usable.',
    close: 'Each plugin has a defined product scope. Install one or combine all five; the business keeps one customer and service history.',
  },
  chrome: {
    title: 'Cleaning Chrome Extensions',
    description: 'Five separate Chrome extensions for cleaning bookings, invoicing, job management, quotes and CRM, with AI Assist and governed access to page context.',
    eyebrow: 'Five Chrome extensions for Cleaning',
    heading: 'Bring the next cleaning task into your browser.',
    intro: 'Install separate extensions for Bookings, Invoicing, Job Management, Quotes and CRM. Each focuses on one kind of work and connects through the shared Cleaning system.',
    installLabel: 'Get Chrome extensions',
    installText: 'Create your account to download or install each extension and follow its setup steps. Choose only the products your team needs, then connect them to the correct company workspace.',
    platformHeading: 'From page context to verified business work.',
    platformSteps: [
      ['Capture only what is needed', 'Grant access to the websites your team approves. The extension reads the relevant page context, extracts useful details, and limits what is shared with an enabled AI provider. Access can be reviewed and revoked.'],
      ['Prepare, review and verify', 'AI Assist can prepare a booking, quote, job update, invoice follow-up or CRM action. The business workflow checks role, company, authority and approval; the extension verifies the resulting record instead of treating a click as proof.'],
    ],
    assistHeading: 'A practical assistant for browser-based work.',
    assist: 'AI Assist can summarise approved page context, extract customer or service details, draft a quote or message, explain a job record and recommend a next action. AI output remains a draft until the appropriate person or configured rule authorises the business change.',
    close: 'Five separate installable products share the Cleaning workforce and browser runtime, covering five workflows without creating competing customer databases.',
  },
}

function ProductFamilyLanding({ platform }) {
  const content = pageContent[platform]
  const isWordPress = platform === 'wordpress'
  const otherPath = isWordPress ? '/chrome-extensions' : '/wordpress-plugins'
  const otherLabel = isWordPress ? 'See Chrome extensions' : 'See WordPress plugins'
  const productLabel = isWordPress ? 'WORDPRESS PLUGIN' : 'CHROME EXTENSION'

  return <>
    <PageMeta title={content.title} description={content.description} />
    <main>
      <section className="relative pt-32 pb-16 px-6 overflow-hidden">
        <div className="absolute -top-48 left-1/2 -translate-x-1/2 w-[800px] h-[800px] hero-glow pointer-events-none" />
        <div className="relative z-10 max-w-5xl mx-auto text-center">
          <SectionLabel>{content.eyebrow}</SectionLabel>
          <h1 className="text-4xl sm:text-6xl font-extrabold mb-5">{content.heading}</h1>
          <p className="text-lg text-nx-muted max-w-3xl mx-auto leading-relaxed">{content.intro}</p>
          <div className="mt-7"><ButtonPrimary href={appRoutes.signup} disabled={!APP_SIGNUP_AVAILABLE}>Sign up to download</ButtonPrimary></div>
        </div>
      </section>

      <section className="px-6 pb-20">
        <div className="max-w-6xl mx-auto grid md:grid-cols-2 xl:grid-cols-3 gap-5">
          {productAreas.map((product, index) => <article key={product.id} className="bg-nx-surface border border-nx-border rounded-2xl p-7">
            <div className="text-xs font-bold text-nx-purple-light mb-4">{productLabel} {String(index + 1).padStart(2, '0')}</div>
            <h2 className="text-2xl font-bold mb-3">Cleaning {product.name}</h2>
            <p className="text-sm text-nx-muted leading-relaxed mb-5">{isWordPress ? product.wordpress : product.chrome}</p>
            <p className="border-t border-nx-border pt-4 text-xs text-nx-muted leading-relaxed"><strong className="text-nx-text">AI Assist:</strong> {product.ai}</p>
            <div className="mt-5"><ButtonPrimary size="sm" href={appRoutes.signup} disabled={!APP_SIGNUP_AVAILABLE}>{isWordPress ? 'Get this plugin' : 'Get this extension'}</ButtonPrimary></div>
          </article>)}
        </div>
      </section>

      <section id="ai-assist" className="px-6 py-20 border-y border-nx-border bg-nx-surface/40">
        <div className="max-w-6xl mx-auto">
          <SectionLabel>AI Assist</SectionLabel>
          <h2 className="text-3xl sm:text-4xl font-extrabold mb-5">{content.assistHeading}</h2>
          <p className="text-nx-muted leading-relaxed max-w-4xl">{content.assist}</p>
          <div className="mt-8 grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {['Interpret requests', 'Extract details', 'Draft work for review', 'Summarise and recommend'].map((item) => <div key={item} className="border border-nx-border rounded-xl p-4 text-sm font-medium">{item}</div>)}
          </div>
        </div>
      </section>

      <section id="install" className="px-6 py-20">
        <div className="max-w-6xl mx-auto">
          <SectionLabel>{isWordPress ? 'WordPress setup' : 'Chrome setup'}</SectionLabel>
          <h2 className="text-3xl sm:text-4xl font-extrabold mb-8">{content.platformHeading}</h2>
          <div className="grid md:grid-cols-2 gap-5">
            {content.platformSteps.map(([title, description], index) => <article key={title} className="border-t border-nx-border pt-6">
              <p className="text-xs font-bold text-nx-purple-light mb-3">{String(index + 1).padStart(2, '0')}</p>
              <h3 className="text-xl font-bold mb-3">{title}</h3>
              <p className="text-sm text-nx-muted leading-relaxed">{description}</p>
            </article>)}
          </div>
          <div className="mt-9 rounded-2xl border border-nx-border bg-nx-surface p-6 sm:p-8">
            <h3 className="text-xl font-bold mb-3">{content.installLabel}</h3>
            <p className="text-sm text-nx-muted leading-relaxed mb-5">{content.installText}</p>
            <ButtonPrimary href={appRoutes.signup} disabled={!APP_SIGNUP_AVAILABLE}>Create your account</ButtonPrimary>
          </div>
          <p className="mt-7 text-sm text-nx-muted leading-relaxed">{content.close}</p>
          <div className="mt-8 flex flex-wrap gap-5">
            <Link to={otherPath} className="text-sm font-semibold text-nx-purple-light hover:text-white">{otherLabel} →</Link>
            <Link to="/works-everywhere" className="text-sm font-semibold text-nx-purple-light hover:text-white">See every way to work →</Link>
            <Link to="/fully-managed" className="text-sm font-semibold text-nx-purple-light hover:text-white">Managed service →</Link>
          </div>
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
