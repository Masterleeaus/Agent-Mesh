import { Link } from 'react-router-dom'
import PageMeta from '../components/PageMeta'
import SectionLabel from '../components/SectionLabel'

const capabilities = [
  ['Enquiries & CRM', 'Capture calls, web requests, messages, referrals and imported prospects. Keep contacts, locations, property details, history, source and customer preferences together.'],
  ['Quotes & service setup', 'Define what is included, the property and room scope, frequency, access needs and company-set fixed, hourly or quote-required pricing.'],
  ['Bookings & recurring work', 'Coordinate customer choices, configured availability, repeat visits, booking changes and property-specific requirements.'],
  ['Teams & scheduling', 'See who is available, match assignments to skills and locations, and handle conflicts, route context and day-of changes.'],
  ['Job management', 'Keep the work order, property, visit, access notes, room or site checklist, time, materials and customer updates connected.'],
  ['Quality & evidence', 'Capture checklist progress, photos, notes, exceptions and accepted completion evidence. Required evidence and incomplete tasks keep a visit from closing as complete.'],
  ['Invoices & payments', 'Prepare billing from verified work, manage receipts, credits and refunds, track payment status, reconcile transactions and follow up on exceptions.'],
  ['Materials & equipment', 'See consumable readiness and job usage, equipment custody, condition, availability and maintenance needs. Purchasing remains under the company’s spending controls.'],
  ['Customer care & retention', 'Recover missed enquiries, keep customers informed, manage complaints, coordinate rework, rebook recurring service and retain useful history.'],
]

const serviceCoverage = [
  ['Residential', 'Recurring, one-off and deep cleans; move-in, move-out and end-of-lease work.'],
  ['Short stay', 'Airbnb and other short-stay turnovers with property-specific room and changeover tasks.'],
  ['Commercial', 'Office and commercial premises, including multi-site cleaning teams.'],
  ['Specialist cleaning', 'Window, pressure, carpet and upholstery services with their own scope, skills, equipment and checklists.'],
  ['Handover and active sites', 'Post-construction/final handover and active construction-site cleaning are distinct service profiles. Active-site work requires access, induction and hazard review.'],
  ['Organising and removal', 'Home organising requires clear customer approval before moving or discarding items. Junk removal is limited to approved categories with disposal evidence; hazardous and regulated waste stays gated.'],
  ['Medical equipment', 'Offered only when manufacturer instructions, approved procedures, verified skills and equipment, applicable standards and review evidence are in place.'],
]

export default function Features() {
  return <>
    <PageMeta title="Cleaning System Features" description="Explore the connected cleaning workflow for CRM, quotes, bookings, scheduling, job management, quality evidence, payments, equipment and customer care." />
    <main>
      <section className="pt-32 pb-16 px-6 text-center">
        <div className="max-w-6xl mx-auto">
          <SectionLabel>Cleaning system features</SectionLabel>
          <h1 className="text-4xl sm:text-6xl font-extrabold mb-5">One system for the work behind every clean.</h1>
          <p className="text-lg text-nx-muted max-w-3xl mx-auto leading-relaxed">Keep customer, service, crew, visit, evidence and payment details connected. The cleaning workforce helps the team move the work along; the business rules and authorised people remain in control.</p>
        </div>
      </section>

      <section className="px-6 pb-24">
        <div className="max-w-7xl mx-auto grid md:grid-cols-2 lg:grid-cols-3 gap-5">{capabilities.map(([title, description], index) => <article key={title} className="bg-nx-surface border border-nx-border rounded-2xl p-7"><div className="text-xs font-bold text-nx-purple-light mb-3">CAPABILITY {String(index + 1).padStart(2, '0')}</div><h2 className="text-xl font-bold mb-3">{title}</h2><p className="text-sm text-nx-muted leading-relaxed">{description}</p></article>)}</div>
      </section>

      <section id="service-range" className="py-20 px-6 border-y border-nx-border bg-nx-surface/30">
        <div className="max-w-6xl mx-auto">
          <SectionLabel>Cleaning service range</SectionLabel>
          <h2 className="text-3xl sm:text-4xl font-extrabold mb-5">Set up the service mix your company delivers.</h2>
          <p className="text-nx-muted leading-relaxed max-w-4xl mb-9">Each service carries its own scope, price mode, team needs, checklist and completion evidence. Availability depends on the company’s configured profile and verified requirements.</p>
          <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">{serviceCoverage.map(([title, description]) => <article key={title} className="border-t border-nx-border pt-5"><h3 className="font-bold mb-2">{title}</h3><p className="text-sm text-nx-muted leading-relaxed">{description}</p></article>)}</div>
        </div>
      </section>

      <section id="ai-assist" className="px-6 py-20">
        <div className="max-w-6xl mx-auto grid lg:grid-cols-2 gap-9 items-start">
          <div><SectionLabel>AI Assist</SectionLabel><h2 className="text-3xl sm:text-4xl font-extrabold mb-4">AI helps prepare the work. Rules govern the action.</h2><p className="text-nx-muted leading-relaxed">Use AI to interpret enquiries, extract information from approved context, summarise records, draft quotes and customer messages, and recommend next steps. Prices, capacity, permissions, completion status and payment records come from configured business rules and verified events.</p></div>
          <div className="grid sm:grid-cols-2 gap-3">{['Draft an enquiry response', 'Summarise a property history', 'Prepare a quote for review', 'Explain a schedule conflict', 'Highlight checklist gaps', 'Draft an invoice follow-up'].map((item) => <div key={item} className="bg-nx-surface border border-nx-border rounded-xl p-4 text-sm font-medium">{item}</div>)}</div>
        </div>
      </section>

      <section id="trust" className="px-6 py-16 border-y border-nx-border">
        <div className="max-w-6xl mx-auto grid md:grid-cols-3 gap-7">
          {[
            ['Company-owned settings', 'The business sets service scope, prices, roles, access, purchasing limits and the work that needs approval.'],
            ['Evidence before completion', 'Required checklists and accepted evidence stay attached to the property and visit. A note or AI summary cannot stand in for required proof.'],
            ['Human review where it matters', 'Sensitive work, scope exceptions, financial changes and external communications follow their configured authority and consent controls.'],
          ].map(([title, description]) => <article key={title} className="border-t border-nx-border pt-5"><h2 className="font-bold mb-2">{title}</h2><p className="text-sm text-nx-muted leading-relaxed">{description}</p></article>)}
        </div>
      </section>

      <section className="px-6 py-16">
        <div className="max-w-6xl mx-auto flex flex-wrap gap-5 border-t border-nx-border pt-7"><Link to="/ai-workforce" className="text-sm font-semibold text-nx-purple-light">Meet the AI workforce →</Link><Link to="/works-everywhere" className="text-sm font-semibold text-nx-purple-light">Works Everywhere →</Link><Link to="/wordpress-plugins" className="text-sm font-semibold text-nx-purple-light">WordPress plugins →</Link><Link to="/chrome-extensions" className="text-sm font-semibold text-nx-purple-light">Chrome extensions →</Link><Link to="/titan-zero" className="text-sm font-semibold text-nx-purple-light">What is Titan Zero? →</Link></div>
      </section>
    </main>
  </>
}
