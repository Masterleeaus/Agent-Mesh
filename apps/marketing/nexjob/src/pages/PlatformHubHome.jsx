import { Link } from 'react-router-dom'
import PageMeta from '../components/PageMeta'
import SectionLabel from '../components/SectionLabel'
import { ButtonPrimary, ButtonOutline } from '../components/Button'
import { APP_SIGNUP_AVAILABLE, appRoutes } from '../config'

const workforceRoles = [
  ['Reception', 'Responds to new enquiries, recovers missed requests, collects service and property details, and routes work to the right next step.'],
  ['Sales', 'Qualifies cleaning work, prepares quotes from configured services and scope, follows up, and keeps customer consent and contact preferences in view.'],
  ['Bookings', 'Coordinates service windows, recurring visits, access notes, property preferences and booking changes.'],
  ['Scheduling', 'Matches approved work to team availability, skills, locations and the day’s workload; flags conflicts and exceptions for review.'],
  ['Job operations', 'Keeps each visit connected to its site, checklist, crew, task progress, materials and completion evidence.'],
  ['Customer care', 'Handles updates, callbacks, service issues, rebooking and follow-up with the right history and escalation context.'],
]

const workflow = [
  ['Enquiry', 'Capture a call, form, message, referral or imported prospect with its source and contact preferences.'],
  ['Scope & quote', 'Record the property, rooms or zones, service, access needs and recurrence; prepare a quote from company-configured pricing.'],
  ['Book', 'Confirm the customer’s choice and place the work into the configured schedule.'],
  ['Assign', 'Give the visit to an available team with the required skills, instructions and site context.'],
  ['Clean & verify', 'Work through the checklist, capture required photos or notes, record exceptions, and confirm completion evidence.'],
  ['Invoice & reconcile', 'Prepare billing from verified work, track payment status, reconcile transactions and follow up on exceptions.'],
  ['Care & repeat', 'Resolve issues, keep customers informed, rebook recurring work and retain the history for the next visit.'],
]

const systemFeatures = [
  ['Customer & prospect records', 'Contacts, companies, service locations, properties, assets, enquiry history, notes, consent and do-not-contact preferences.'],
  ['Cleaning service setup', 'Company-selected services, clear inclusions, exclusions, fixed or hourly pricing, quote-required work and recurrence rules.'],
  ['Quotes & bookings', 'Scope, revisions, customer acceptance, signatures and documents connected to the booked work.'],
  ['Scheduling & teams', 'People, team availability, capability matching, locations, assignments, changes and exceptions.'],
  ['Field jobs & quality', 'Property-specific room or site checklists, visit tasks, time and materials, customer updates, photos and accepted completion evidence.'],
  ['Invoices & payments', 'Billing readiness, invoices, receipts, credits, refunds, payment tracking and reconciliation across enabled payment methods.'],
  ['Materials & equipment', 'Consumable readiness, job usage, equipment custody, condition, availability and maintenance signals.'],
  ['Customer care', 'Missed-enquiry recovery, service updates, complaints, rework, rebooking, retention and referral handoff.'],
]

const serviceGroups = [
  ['Homes', 'Recurring, one-off and deep cleans; move-in, move-out and end-of-lease work; home organising with customer-approved scope.'],
  ['Short stays', 'Airbnb and other short-stay turnovers, with property access, room tasks, changeover timing and completion records.'],
  ['Commercial', 'Offices and other commercial premises, including multi-site customers and site-specific instructions.'],
  ['Specialist cleaning', 'Windows, pressure washing, carpet and upholstery work, with service-specific scope, skills, equipment and checklists.'],
  ['Construction & handover', 'Post-construction and final-handover cleaning. Active-site work is a separate service with access, induction and hazard gates.'],
  ['Bounded specialist work', 'Rubbish and junk removal only for approved item categories and documented disposal handoff. Medical-equipment cleaning is enabled only after procedures, qualifications, equipment and review are verified.'],
]

export default function PlatformHubHome() {
  return <>
    <PageMeta title="Cleaning Workforce & Business System" description="One connected cleaning workforce and operating system for enquiries, quotes, bookings, field jobs, invoices, customer care and repeat service." />
    <main>
      <section id="how-it-works" className="relative pt-36 pb-24 px-6 overflow-hidden">
        <div className="absolute -top-48 left-1/2 -translate-x-1/2 w-[800px] h-[800px] hero-glow pointer-events-none" />
        <div className="relative z-10 max-w-6xl mx-auto">
          <div className="max-w-4xl mx-auto text-center">
            <SectionLabel>Cleaning workforce & business system</SectionLabel>
            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-black leading-[1.04] tracking-tight mb-6">Every clean, from first enquiry to repeat booking.</h1>
            <p className="text-lg text-nx-muted max-w-3xl mx-auto mb-9 leading-relaxed">Bring your people, AI specialists and day-to-day cleaning workflows into one connected system. Track the customer, property, quote, booking, crew, checklist, evidence, invoice and follow-up together—so work keeps moving and everyone can see what happens next.</p>
            <div className="flex justify-center gap-4 flex-wrap">
              <ButtonPrimary href={appRoutes.signup} disabled={!APP_SIGNUP_AVAILABLE}>Sign up for Cleaning</ButtonPrimary>
              <ButtonOutline to="/ai-workforce">Meet the AI workforce</ButtonOutline>
            </div>
            <p className="mt-6 text-sm text-nx-muted2">Titan Zero manages the workforce and system behind your cleaning operation. <Link to="/titan-zero" className="text-nx-purple-light hover:text-white">What that means →</Link></p>
          </div>
          <div className="mt-16 grid sm:grid-cols-2 xl:grid-cols-4 gap-3" aria-label="Cleaning system at a glance">
            {['Find and qualify work', 'Quote and book', 'Schedule and deliver', 'Verify, invoice and rebook'].map((item, i) => <div key={item} className="rounded-xl border border-nx-border bg-nx-surface/70 p-5"><span className="block text-xs font-bold text-nx-purple-light mb-2">0{i + 1}</span><span className="font-semibold">{item}</span></div>)}
          </div>
        </div>
      </section>

      <section id="workforce" className="px-6 py-24 border-y border-nx-border bg-nx-surface/30">
        <div className="max-w-6xl mx-auto">
          <div className="max-w-3xl mb-12">
            <SectionLabel>AI workforce</SectionLabel>
            <h2 className="text-3xl sm:text-4xl font-extrabold mb-4">Specialist roles work alongside your team.</h2>
            <p className="text-nx-muted leading-relaxed">Six cleaning-focused workforce functions coordinate the digital work around real cleaning jobs. Your owner, managers and cleaners remain part of the same operating picture, with permissions and approvals matched to each role.</p>
          </div>
          <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">{workforceRoles.map(([title, description], index) => <article key={title} className="border border-nx-border rounded-2xl bg-nx-bg p-6"><span className="text-xs font-bold text-nx-purple-light">ROLE 0{index + 1}</span><h3 className="text-xl font-bold mt-3 mb-2">{title}</h3><p className="text-sm text-nx-muted leading-relaxed">{description}</p></article>)}</div>
          <div className="mt-8"><Link to="/ai-workforce" className="text-sm font-semibold text-nx-purple-light hover:text-white">Explore the cleaning workforce →</Link></div>
        </div>
      </section>

      <section id="workflows" className="px-6 py-24">
        <div className="max-w-6xl mx-auto">
          <div className="grid lg:grid-cols-[0.8fr_1.2fr] gap-10 items-end mb-12">
            <div><SectionLabel>One connected workflow</SectionLabel><h2 className="text-3xl sm:text-4xl font-extrabold">The handoff stays with the job.</h2></div>
            <p className="text-nx-muted leading-relaxed">A customer’s request becomes a scoped service, a quote, a scheduled visit, a completed and evidenced job, then a reconciled payment and useful follow-up. Changes and exceptions carry their context forward.</p>
          </div>
          <ol className="grid md:grid-cols-2 xl:grid-cols-4 gap-5">{workflow.map(([title, description], index) => <li key={title} className="border-t border-nx-border pt-5"><p className="text-xs font-bold text-nx-purple-light mb-3">{String(index + 1).padStart(2, '0')}</p><h3 className="font-bold mb-2">{title}</h3><p className="text-sm text-nx-muted leading-relaxed">{description}</p></li>)}</ol>
        </div>
      </section>

      <section id="features" className="px-6 py-24 border-y border-nx-border">
        <div className="max-w-6xl mx-auto">
          <div className="max-w-3xl mb-11"><SectionLabel>The operating system</SectionLabel><h2 className="text-3xl sm:text-4xl font-extrabold mb-4">The details that keep a cleaning business running.</h2><p className="text-nx-muted leading-relaxed">Keep the daily business record connected: who asked, what was agreed, where the work happens, who is assigned, what was completed, what needs attention and what is ready to bill.</p></div>
          <div className="grid md:grid-cols-2 xl:grid-cols-4 gap-4">{systemFeatures.map(([title, description]) => <article key={title} className="bg-nx-surface border border-nx-border rounded-2xl p-6"><h3 className="font-bold mb-2">{title}</h3><p className="text-sm text-nx-muted leading-relaxed">{description}</p></article>)}</div>
          <div className="mt-8 flex gap-5 flex-wrap"><Link to="/features" className="text-sm font-semibold text-nx-purple-light hover:text-white">See all system features →</Link><Link to="/wordpress-plugins" className="text-sm font-semibold text-nx-purple-light hover:text-white">WordPress plugins →</Link><Link to="/chrome-extensions" className="text-sm font-semibold text-nx-purple-light hover:text-white">Chrome extensions →</Link></div>
        </div>
      </section>

      <section id="service-range" className="px-6 py-24">
        <div className="max-w-6xl mx-auto">
          <div className="max-w-3xl mb-11"><SectionLabel>Cleaning work</SectionLabel><h2 className="text-3xl sm:text-4xl font-extrabold mb-4">Built for the services cleaning businesses actually deliver.</h2><p className="text-nx-muted leading-relaxed">Configure the service mix, price rules, crew skills, equipment and checklists for your company. Specialist work stays within its approved scope and prerequisites.</p></div>
          <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">{serviceGroups.map(([title, description]) => <article key={title} className="border-t border-nx-border pt-5"><h3 className="font-bold mb-2">{title}</h3><p className="text-sm text-nx-muted leading-relaxed">{description}</p></article>)}</div>
          <p className="mt-9 text-xs text-nx-muted2 leading-relaxed">Service availability is configured for each company. Restricted waste, hazardous remediation, medical-equipment work and active construction sites require the relevant authorization, skills, equipment, procedures and review before work can be offered.</p>
        </div>
      </section>

      <section className="px-6 py-20 border-y border-nx-border bg-nx-surface/30">
        <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-8">
          <article className="border-t border-nx-border pt-6"><SectionLabel>Works Everywhere</SectionLabel><h2 className="text-2xl font-bold mb-3">Use the system from the tools your team already opens.</h2><p className="text-sm text-nx-muted leading-relaxed mb-5">Mobile app, PWA, five Chrome extensions, five WordPress plugins, ChatGPT, WhatsApp, Telegram and Facebook Messenger connect owners and staff to the cleaning workflow.</p><Link to="/works-everywhere" className="text-sm font-semibold text-nx-purple-light hover:text-white">Explore every surface →</Link></article>
          <article className="border-t border-nx-border pt-6"><SectionLabel>Managed service</SectionLabel><h2 className="text-2xl font-bold mb-3">Get help setting up the system around your team.</h2><p className="text-sm text-nx-muted leading-relaxed mb-5">Choose self-serve or get help configuring your services, workflows, existing software and ongoing operation.</p><Link to="/fully-managed" className="text-sm font-semibold text-nx-purple-light hover:text-white">Explore managed service →</Link></article>
        </div>
      </section>

      <section className="px-6 py-20">
        <div className="max-w-6xl mx-auto flex flex-wrap items-center justify-between gap-6 border-t border-nx-border pt-7">
          <div><SectionLabel>Start with your workflow</SectionLabel><h2 className="text-2xl font-bold">Put every handoff in one place.</h2></div>
          <div className="flex flex-wrap gap-5"><Link to="/pricing" className="text-sm text-nx-purple-light hover:text-white">Pricing →</Link><Link to="/faq" className="text-sm text-nx-purple-light hover:text-white">Questions →</Link><Link to="/resources" className="text-sm text-nx-purple-light hover:text-white">Resources →</Link></div>
        </div>
      </section>
    </main>
  </>
}
