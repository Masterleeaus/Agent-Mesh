import { Link } from 'react-router-dom'
import PageMeta from '../components/PageMeta'
import SectionLabel from '../components/SectionLabel'

const principles = [
  ['Built around real service work', 'The product follows the path from customer enquiry and quote through scheduled visits, checklist evidence, billing and repeat service.'],
  ['Useful with your existing tools', 'Connect the systems that already help your business. Add an interface or capability when a gap is getting in the way.'],
  ['People stay in control', 'Business rules, company roles and approvals govern what can happen. AI support does not create permission to make a change.'],
  ['Clear records and handoffs', 'Keep customer decisions, team assignments, completion evidence and financial outcomes connected to the same job history.'],
]

export default function About() {
  return <>
    <PageMeta title="About the Cleaning System" description="Titan Zero builds a connected cleaning workforce and business system for service businesses." />
    <main>
      <section className="pt-32 pb-16 px-6 text-center"><div className="max-w-5xl mx-auto"><SectionLabel>About</SectionLabel><h1 className="text-4xl sm:text-6xl font-extrabold mb-5">Cleaning work deserves a connected operating system.</h1><p className="text-lg text-nx-muted max-w-3xl mx-auto">We are building for the practical work of running a cleaning company: answering enquiries, scoping services, looking after customers, coordinating teams, documenting quality and getting paid.</p></div></section>
      <section className="px-6 pb-20"><div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-5">{principles.map(([title, description]) => <article key={title} className="bg-nx-surface border border-nx-border rounded-2xl p-7"><h2 className="text-xl font-bold mb-3">{title}</h2><p className="text-sm text-nx-muted leading-relaxed">{description}</p></article>)}</div></section>
      <section className="px-6 py-20 border-y border-nx-border bg-nx-surface/30"><div className="max-w-5xl mx-auto text-center"><SectionLabel>Our platform</SectionLabel><h2 className="text-3xl sm:text-4xl font-extrabold mb-5">Titan Zero manages the workforce and system behind the Cleaning product.</h2><p className="text-nx-muted leading-relaxed mb-8">It brings the AI specialists, business workflows and connected tools together around the company’s operating rules. <Link to="/titan-zero" className="text-nx-purple-light">Read the one-page explanation →</Link></p><div className="flex justify-center flex-wrap gap-5"><Link to="/features" className="text-sm font-semibold text-nx-purple-light">Explore features →</Link><Link to="/ai-workforce" className="text-sm font-semibold text-nx-purple-light">Meet the workforce →</Link><Link to="/fully-managed" className="text-sm font-semibold text-nx-purple-light">Managed service →</Link></div></div></section>
    </main>
  </>
}
