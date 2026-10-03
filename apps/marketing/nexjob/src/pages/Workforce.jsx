import { Link } from 'react-router-dom'
import SectionLabel from '../components/SectionLabel'
import CTASection from '../components/CTASection'

const roles = [
  ['Reception', 'Answers enquiries, gathers service and site details, recovers missed calls and messages, and routes qualified requests.'],
  ['Sales', 'Builds a clear scope, prepares a quote from configured service and pricing rules, follows up with consent, and carries customer decisions into the job.'],
  ['Bookings', 'Coordinates service windows, recurring visits, property access, customer preferences and changes.'],
  ['Scheduling', 'Plans team assignments against availability, location, skills and workload; surfaces conflicts before they disrupt a visit.'],
  ['Jobs', 'Keeps the field team connected to the work order, site instructions, tasks, room or zone checklist, materials, photos and completion evidence.'],
  ['Customer care', 'Manages updates, callbacks, issues, recovery, rebooking and service history with a clear escalation path.'],
]

const humanResponsibilities = [
  ['Set the operating rules', 'Owners configure services, prices, availability, team roles, limits and approval requirements.'],
  ['Review important decisions', 'Quotes, scope exceptions, financial changes and sensitive service work go to an authorised person when required.'],
  ['Deliver physical work', 'Cleaners bring real-world judgement, skill and care to each property; the system carries the agreed plan and captures the result.'],
]

export default function Workforce() {
  return <>
    <main>
      <section className="pt-32 pb-20 px-6 text-center">
        <div className="max-w-5xl mx-auto">
          <SectionLabel>Cleaning AI workforce</SectionLabel>
          <h1 className="text-4xl sm:text-6xl font-extrabold mb-5">A specialist team for every part of the cleaning journey.</h1>
          <p className="text-lg text-nx-muted max-w-3xl mx-auto leading-relaxed">Six role-based specialist workflows coordinate the digital work around your human team—from the first enquiry to the completed clean, invoice and next booking. AI Assist helps each workflow handle language and information work; every role has a defined scope, company context and clear limits.</p>
        </div>
      </section>

      <section className="px-6 pb-24">
        <div className="max-w-6xl mx-auto grid md:grid-cols-2 xl:grid-cols-3 gap-5">{roles.map(([title, description], index) => <article key={title} className="bg-nx-surface border border-nx-border rounded-2xl p-7"><div className="text-xs text-nx-purple-light font-bold mb-3">WORKFORCE ROLE 0{index + 1}</div><h2 className="text-2xl font-bold mb-3">{title}</h2><p className="text-sm text-nx-muted leading-relaxed">{description}</p></article>)}</div>
      </section>

      <section className="py-20 px-6 border-y border-nx-border">
        <div className="max-w-6xl mx-auto">
          <SectionLabel>One team, one work queue</SectionLabel>
          <h2 className="text-3xl sm:text-4xl font-extrabold mb-5">People and AI share the same operating picture.</h2>
          <p className="text-nx-muted leading-relaxed max-w-4xl mb-9">Managers can see incoming work, current assignments, conversations, exceptions, approvals and completion evidence. Team members receive the details they need for their role, and customer care can pick up a concern without losing the service history.</p>
          <div className="grid md:grid-cols-3 gap-4">{humanResponsibilities.map(([title, description]) => <article key={title} className="border-t border-nx-border pt-5"><h3 className="font-bold mb-2">{title}</h3><p className="text-sm text-nx-muted leading-relaxed">{description}</p></article>)}</div>
        </div>
      </section>

      <section id="ai-assist" className="px-6 py-20">
        <div className="max-w-5xl mx-auto grid md:grid-cols-2 gap-8 items-start">
          <div><SectionLabel>AI Assist</SectionLabel><h2 className="text-3xl sm:text-4xl font-extrabold mb-4">Handle the language work. Keep business rules in control.</h2><p className="text-nx-muted leading-relaxed">AI can interpret a request, extract details, summarise a customer history, draft a quote or message, explain an exception and recommend a next step. Pricing, availability, permissions, accepted evidence and payment state come from the business system and its approval rules.</p></div>
          <div className="space-y-3">{['Prepare a reply to a new cleaning enquiry', 'Summarise a property and its service history', 'Draft a quote for owner review', 'Explain a job exception and suggest next actions', 'Prepare an invoice follow-up from verified payment status'].map((item) => <div key={item} className="border border-nx-border bg-nx-surface rounded-xl p-4 text-sm">{item}</div>)}</div>
        </div>
      </section>

      <section className="px-6 py-16 border-y border-nx-border bg-nx-surface/30">
        <div className="max-w-6xl mx-auto flex flex-wrap items-center justify-between gap-6">
          <div><SectionLabel>Connect the work</SectionLabel><h2 className="text-2xl font-bold">Workforce, workflow and tools belong together.</h2></div>
          <div className="flex flex-wrap gap-5"><Link to="/features" className="text-sm font-semibold text-nx-purple-light">Explore the system →</Link><Link to="/works-everywhere" className="text-sm font-semibold text-nx-purple-light">See every surface →</Link></div>
        </div>
      </section>

      <CTASection title="Give your cleaning team more room to do great work." subtitle="Connect enquiries, scheduling, field jobs, customer care and follow-up in one cleaning workflow." />
    </main>
  </>
}
