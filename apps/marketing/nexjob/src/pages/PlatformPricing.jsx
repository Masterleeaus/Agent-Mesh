import { Link } from 'react-router-dom'
import PageMeta from '../components/PageMeta'
import SectionLabel from '../components/SectionLabel'
import { ButtonPrimary } from '../components/Button'
import { APP_SIGNUP_AVAILABLE, appRoutes } from '../config'

const plans = [
  ['Solo', 'For an owner-led cleaning business or small team.', 'Core Cleaning system and AI Assist for up to 3 people.'],
  ['Team', 'For a growing cleaning crew and office team.', 'Shared workflow, team coordination and connected work surfaces for teams up to around 10 people.'],
  ['Business', 'For larger and multi-site cleaning operations.', 'Broader workforce, operating controls and service coordination as the business grows.'],
  ['Sovereign', 'For enterprise and regulated deployment needs.', 'Advanced privacy, infrastructure, audit and deployment options for organisations with additional requirements.'],
]

const productTiers = [
  { name: 'Assist', price: 'Included', label: 'with your Cleaning plan', detail: 'AI helps with drafts, summaries and suggestions. Your team remains the primary operator.' },
  { name: 'Plus', price: 'A$19', label: 'per product / month', detail: 'Semi-autonomous monitoring, prepared tasks and coordinated workflows with approval and policy gates.' },
  { name: 'Pro', price: 'A$49', label: 'per product / month', detail: 'Policy-bounded autonomous tasks with predictive signals and clear escalation for restricted work.' },
]

const upgrades = [
  { id: 'cleaner-mobile', name: 'Titan Go field app', price: 'A$8', unit: 'per active cleaner / month', detail: 'Mobile job lists, site instructions, checklists, progress updates, photos and notes. Titan Command for owners and managers is included.' },
  { id: 'reception', name: 'AI Reception', price: 'From A$99', unit: 'per business / month, plus channel usage', detail: 'Answer calls and messages, capture and qualify enquiries, book from configured availability, recover missed calls and follow up on eligible overdue invoices.' },
  { id: 'marketing-system', name: 'Omnichannel Marketing', price: 'A$79', unit: 'per business / month, plus channel usage', detail: 'Plan and measure customer campaigns across SMS, WhatsApp, Messenger, Telegram and phone, with web chat and email where connected.' },
  { id: 'lead-generation', name: 'Lead Generation', price: 'A$79', unit: 'per business / month, plus provider usage', detail: 'Schedule approved local business discovery, import call lists, review and deduplicate prospects, then prepare eligible outreach.' },
]

export default function PlatformPricing() {
  return <>
    <PageMeta title="Cleaning SaaS Plans & Pricing" description="Compare Cleaning plans, Assist, Plus and Pro product tiers, the cleaner mobile app, AI Reception, omnichannel marketing and lead generation." />
    <main>
      <section className="pt-32 pb-16 px-6 text-center">
        <div className="max-w-5xl mx-auto">
          <SectionLabel>Cleaning plans & upgrades</SectionLabel>
          <h1 className="text-4xl sm:text-6xl font-extrabold mb-5">Pricing that grows with your cleaning operation.</h1>
          <p className="text-lg text-nx-muted max-w-3xl mx-auto">Choose the business plan for your team, then add the workflow automation, field apps and customer-growth tools you need.</p>
        </div>
      </section>

      <section className="px-6 pb-20">
        <div className="max-w-6xl mx-auto grid md:grid-cols-2 xl:grid-cols-4 gap-4">
          {plans.map(([name, audience, details]) => <article key={name} className="bg-nx-surface border border-nx-border rounded-2xl p-6">
            <p className="text-xs font-bold uppercase tracking-wide text-nx-purple-light mb-3">Cleaning plan</p>
            <h2 className="text-2xl font-extrabold mb-3">{name}</h2>
            <p className="text-sm font-semibold mb-3">{audience}</p>
            <p className="text-sm text-nx-muted leading-relaxed">{details}</p>
          </article>)}
        </div>
        <p className="max-w-6xl mx-auto mt-5 text-sm text-nx-muted">Business plans set team size and platform entitlements. Product tiers set how much AI can handle in each enabled workflow.</p>
      </section>

      <section id="product-tiers" className="px-6 py-20 border-y border-nx-border bg-nx-surface/30">
        <div className="max-w-6xl mx-auto">
          <SectionLabel>Five WordPress plugins · five Chrome extensions</SectionLabel>
          <h2 className="text-3xl sm:text-4xl font-extrabold mb-5">One product price across both surfaces.</h2>
          <p className="text-nx-muted leading-relaxed max-w-4xl mb-9">Choose Bookings, Invoicing, Job Management, Quotes and CRM individually, or bundle all five. A product licence works in both its WordPress plugin and Chrome extension, so installing both does not double the subscription.</p>
          <div className="grid md:grid-cols-3 gap-4">
            {productTiers.map(({ name, price, label, detail }) => <article key={name} className="border border-nx-border rounded-2xl bg-nx-bg p-6">
              <p className="text-xs font-bold text-nx-purple-light uppercase tracking-wide mb-3">{name === 'Assist' ? 'AI-assisted' : name === 'Plus' ? 'Semi-autonomous' : 'Autonomous + predictive'}</p>
              <h3 className="text-xl font-bold mb-2">{name}</h3>
              <p className="text-2xl font-extrabold">{price}</p>
              <p className="text-xs text-nx-muted mb-4">{label}</p>
              <p className="text-sm text-nx-muted leading-relaxed">{detail}</p>
            </article>)}
          </div>
          <div className="mt-6 rounded-xl border border-nx-border bg-nx-bg p-5">
            <p className="font-semibold">Bundle all five workflows</p>
            <p className="mt-2 text-sm text-nx-muted leading-relaxed"><strong className="text-nx-text">Plus: A$59/month.</strong> <strong className="text-nx-text">Pro: A$149/month.</strong> All five products share one Cleaning business record and workforce.</p>
          </div>
        </div>
      </section>

      <section id="upgrades" className="px-6 py-20">
        <div className="max-w-6xl mx-auto">
          <SectionLabel>Optional upgrades</SectionLabel>
          <h2 className="text-3xl sm:text-4xl font-extrabold mb-5">Add the people and channels your business needs.</h2>
          <p className="text-nx-muted leading-relaxed max-w-4xl mb-9">Start with the owner workspace, then extend the same system to cleaners in the field, customers on the phone and your marketing channels.</p>
          <div className="grid md:grid-cols-2 gap-4">
            {upgrades.map(({ id, name, price, unit, detail }) => <article id={id} key={id} className="border border-nx-border rounded-2xl bg-nx-surface p-6">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div><p className="text-xs font-bold text-nx-purple-light uppercase tracking-wide mb-2">Upgrade</p><h3 className="text-xl font-bold">{name}</h3></div>
                <div className="text-right"><p className="text-xl font-extrabold">{price}</p><p className="text-xs text-nx-muted">{unit}</p></div>
              </div>
              <p className="mt-4 text-sm text-nx-muted leading-relaxed">{detail}</p>
              {id === 'reception' && <Link to="/reception" className="mt-4 inline-flex text-sm font-semibold text-nx-purple-light">Explore AI Reception →</Link>}
              {id === 'marketing-system' && <Link to="/marketing" className="mt-4 inline-flex text-sm font-semibold text-nx-purple-light">Explore the marketing system →</Link>}
              {id === 'lead-generation' && <Link to="/lead-generation" className="mt-4 inline-flex text-sm font-semibold text-nx-purple-light">Explore lead generation →</Link>}
            </article>)}
          </div>
          <div className="mt-5 rounded-xl border border-nx-border bg-nx-surface p-5">
            <p className="font-semibold">Growth bundle: A$199/month</p>
            <p className="mt-2 text-sm text-nx-muted leading-relaxed">AI Reception, Omnichannel Marketing and Lead Generation together, with voice, messaging and approved data-provider usage billed separately.</p>
          </div>
          <p className="mt-7 text-xs text-nx-muted2 leading-relaxed">Prices are in AUD per month. Applicable tax is calculated at checkout. Phone, SMS, WhatsApp and approved lead-source usage vary by provider and are shown separately before activation.</p>
        </div>
      </section>

      <section className="px-6 pb-24">
        <div className="max-w-4xl mx-auto rounded-2xl border border-nx-border bg-nx-surface p-8 sm:p-10 text-center">
          <h2 className="text-2xl sm:text-3xl font-bold mb-4">Set up the right plan for your team.</h2>
          <p className="text-sm text-nx-muted leading-relaxed mb-7">Plan, product and usage entitlements are shown separately. A subscription does not grant staff or AI authority to approve business actions; your company’s roles and policies still apply.</p>
          <ButtonPrimary size="lg" href={appRoutes.signup} disabled={!APP_SIGNUP_AVAILABLE}>View plans and sign up</ButtonPrimary>
        </div>
      </section>
    </main>
  </>
}
