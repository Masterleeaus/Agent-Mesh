import { Link } from 'react-router-dom'
import PageMeta from '../components/PageMeta'
import SectionLabel from '../components/SectionLabel'

const responsibilities = [
  ['Coordinate the workforce', 'Connect the six cleaning specialist roles with owners, managers, cleaners and customer care around the work each person owns.'],
  ['Connect the system', 'Keep enquiries, CRM, service setup, quotes, bookings, visits, evidence, invoices and follow-up joined as one operating workflow.'],
  ['Manage the tools', 'Bring the mobile app, PWA, WordPress plugins, Chrome extensions and messaging channels into a consistent company workspace.'],
  ['Govern business actions', 'Apply company roles, permissions, approval steps, customer consent, service boundaries and evidence requirements to the actions the workforce prepares.'],
]

const operatingPrinciples = [
  ['One business record', 'Connected tools use the Cleaning company’s canonical customer and job context instead of creating competing business histories.'],
  ['AI assists the work', 'AI can interpret, summarise, draft and recommend. Configured business rules determine pricing, availability, permissions and transaction state.'],
  ['People remain accountable', 'Owners and authorised team members approve sensitive decisions and handle exceptions according to their role.'],
]

export default function YourZero() {
  return <>
    <PageMeta title="What Is Titan Zero?" description="Titan Zero manages the AI workforce, Cleaning business system, connected tools, permissions and approvals around a cleaning operation." />
    <main>
      <section className="pt-32 pb-20 px-6 text-center">
        <div className="max-w-5xl mx-auto">
          <SectionLabel>What is Titan Zero?</SectionLabel>
          <h1 className="text-4xl sm:text-6xl font-extrabold mb-5">The management layer behind the cleaning workforce.</h1>
          <p className="text-lg text-nx-muted max-w-3xl mx-auto leading-relaxed">Titan Zero coordinates the people, AI specialists, business workflows and connected tools that keep a cleaning company running. It gives the workforce the company context and operating rules it needs, then keeps proposals, approvals, work and evidence connected.</p>
        </div>
      </section>

      <section className="px-6 py-20 border-y border-nx-border bg-nx-surface/30">
        <div className="max-w-6xl mx-auto">
          <SectionLabel>One coordinated operation</SectionLabel>
          <h2 className="text-3xl sm:text-4xl font-extrabold mb-8">The workforce works inside the business system.</h2>
          <div className="grid md:grid-cols-2 gap-5">{responsibilities.map(([title, description], index) => <article key={title} className="bg-nx-bg border border-nx-border rounded-2xl p-7"><p className="text-xs font-bold text-nx-purple-light mb-3">0{index + 1}</p><h3 className="text-xl font-bold mb-3">{title}</h3><p className="text-sm text-nx-muted leading-relaxed">{description}</p></article>)}</div>
        </div>
      </section>

      <section className="px-6 py-20">
        <div className="max-w-6xl mx-auto">
          <SectionLabel>How it operates</SectionLabel>
          <h2 className="text-3xl sm:text-4xl font-extrabold mb-8">Useful intelligence, bounded authority.</h2>
          <div className="grid md:grid-cols-3 gap-5">{operatingPrinciples.map(([title, description]) => <article key={title} className="border-t border-nx-border pt-5"><h3 className="font-bold mb-2">{title}</h3><p className="text-sm text-nx-muted leading-relaxed">{description}</p></article>)}</div>
          <div className="mt-10 rounded-2xl border border-nx-border bg-nx-surface p-7 sm:p-9">
            <p className="text-xs uppercase tracking-wide font-bold text-nx-purple-light mb-4">The cleaning work lifecycle</p>
            <p className="text-lg sm:text-xl font-semibold leading-relaxed">Enquiry → scope → quote → booking → assignment → clean → evidence → invoice → payment → customer care → repeat service</p>
          </div>
        </div>
      </section>

      <section className="px-6 py-20 border-y border-nx-border">
        <div className="max-w-5xl mx-auto text-center">
          <SectionLabel>For cleaning businesses</SectionLabel>
          <h2 className="text-3xl sm:text-4xl font-extrabold mb-5">A system your team can work with.</h2>
          <p className="text-nx-muted leading-relaxed mb-8">Use Titan Zero through the Cleaning SaaS, connected WordPress plugins, Chrome extensions, mobile app, PWA and communication channels. Choose self-serve or get implementation and ongoing help through the managed service.</p>
          <div className="flex justify-center flex-wrap gap-5"><Link to="/" className="text-sm font-semibold text-nx-purple-light">Explore the Cleaning system →</Link><Link to="/ai-workforce" className="text-sm font-semibold text-nx-purple-light">Meet the workforce →</Link><Link to="/works-everywhere" className="text-sm font-semibold text-nx-purple-light">See every surface →</Link><Link to="/fully-managed" className="text-sm font-semibold text-nx-purple-light">Managed service →</Link></div>
        </div>
      </section>
    </main>
  </>
}
