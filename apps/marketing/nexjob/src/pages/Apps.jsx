import { Link } from 'react-router-dom'
import PageMeta from '../components/PageMeta'
import SectionLabel from '../components/SectionLabel'

const apps = [
  ['Command', 'Owner and manager workspace', ['business workboard', 'AI workforce', 'quotes and bookings', 'team schedule', 'approvals and exceptions', 'revenue and operations'], 'See incoming demand, current work, team capacity, approvals and business outcomes in one place. Configure the company’s service, pricing, communication and authority rules.'],
  ['Go', 'Staff and field workspace', ['today’s visits', 'site instructions', 'room checklists', 'photos and notes', 'materials and time', 'customer updates'], 'Give cleaners the property details and task list for each visit. Staff can update progress, capture evidence, ask questions and flag work that needs a manager.'],
  ['Hub', 'Customer workspace', ['service requests', 'quotes and approvals', 'booking changes', 'visit updates', 'service history', 'support and follow-up'], 'Let customers request a clean, review a quote, confirm a booking, share relevant site information and follow the service without learning the internal business system.'],
]

export default function Apps() {
  return <>
    <PageMeta title="Cleaning Business Apps" description="Owner, field staff and customer apps for the connected Cleaning workforce and operating system." />
    <main>
      <section className="pt-32 pb-16 px-6 text-center"><div className="max-w-5xl mx-auto"><SectionLabel>Cleaning apps</SectionLabel><h1 className="text-4xl sm:text-6xl font-extrabold mb-5">The right view for every person doing the work.</h1><p className="text-lg text-nx-muted max-w-3xl mx-auto">Owners, field teams and customers use focused workspaces that connect to the same cleaning business records and service journey.</p></div></section>
      <section className="px-6 pb-20"><div className="max-w-6xl mx-auto grid lg:grid-cols-3 gap-5">{apps.map(([name, audience, items, description]) => <article key={name} className="bg-nx-surface border border-nx-border rounded-2xl p-7"><div className="text-xs uppercase tracking-wide text-nx-purple-light font-bold mb-3">{audience}</div><h2 className="text-3xl font-extrabold mb-4">{name}</h2><div className="flex flex-wrap gap-2 mb-6">{items.map((item) => <span key={item} className="bg-nx-bg border border-nx-border rounded-lg px-3 py-2 text-xs">{item}</span>)}</div><p className="text-sm text-nx-muted leading-relaxed">{description}</p></article>)}</div></section>
      <section className="px-6 py-20 border-y border-nx-border bg-nx-surface/30"><div className="max-w-6xl mx-auto grid lg:grid-cols-2 gap-8"><div><SectionLabel>One service relationship</SectionLabel><h2 className="text-3xl sm:text-4xl font-extrabold mb-4">Customers see only the details they need.</h2><p className="text-nx-muted leading-relaxed">Customers can request or change work, review quotes and understand visit progress. Staff see assigned jobs and instructions. Managers see the full operating picture and handle actions within their authority.</p></div><div className="bg-nx-bg border border-nx-border rounded-2xl p-7"><h3 className="text-xl font-bold mb-3">Every workspace has its own access boundary.</h3><p className="text-sm text-nx-muted leading-relaxed">Company identity, role, customer relationship and approval rules determine what each person can view and do. A connected tool or channel never grants access by itself.</p></div></div></section>
      <section className="px-6 py-16"><div className="max-w-6xl mx-auto flex flex-wrap gap-5 border-t border-nx-border pt-7"><Link to="/works-everywhere" className="text-sm font-semibold text-nx-purple-light">See apps and channels →</Link><Link to="/ai-workforce" className="text-sm font-semibold text-nx-purple-light">Meet the workforce →</Link><Link to="/features" className="text-sm font-semibold text-nx-purple-light">Explore the system →</Link></div></section>
    </main>
  </>
}
