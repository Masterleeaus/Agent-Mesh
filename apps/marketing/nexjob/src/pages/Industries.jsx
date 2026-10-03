import PageMeta from '../components/PageMeta'
import SectionLabel from '../components/SectionLabel'
import { Link } from 'react-router-dom'

const cleaningServices = [
  'Regular, one-off and deep cleaning',
  'End-of-lease and move-in / move-out cleaning',
  'Short-stay turnover cleaning',
  'Commercial and office cleaning',
  'Carpet, upholstery and window cleaning',
  'Pressure and post-construction cleaning',
]

export default function Industries() {
  return <>
    <PageMeta title="Cleaning SaaS" description="Titan Zero is focused on cleaning businesses for its initial SaaS launch." />
    <main className="pt-32 pb-24 px-6">
      <div className="max-w-6xl mx-auto">
        <SectionLabel>Cleaning SaaS</SectionLabel>
        <h1 className="text-4xl sm:text-6xl font-extrabold mb-5">One launch vertical: Cleaning.</h1>
        <p className="text-lg text-nx-muted max-w-3xl mb-10">The first Titan Zero SaaS launch is focused on cleaning companies. The codebase contains a substantial cleaning catalogue, service model, workflow blueprint and dedicated test coverage. The vertical is still in development; this page does not claim a production-ready installation.</p>
        <div className="grid lg:grid-cols-[1fr_0.8fr] gap-10 border-t border-nx-border pt-8">
          <div>
            <h2 className="text-2xl font-bold mb-4">Cleaning work modelled in the current implementation</h2>
            <ul className="grid sm:grid-cols-2 gap-x-8">{cleaningServices.map((service) => <li key={service} className="border-b border-nx-border py-4 text-sm text-nx-muted">{service}</li>)}</ul>
          </div>
          <aside className="border-t border-nx-border pt-6">
            <h2 className="text-xl font-bold mb-3">Explore the Cleaning workflow</h2>
            <p className="text-sm text-nx-muted leading-relaxed mb-5">Review how enquiries, quotes, recurring schedules, crew assignment, job evidence, quality review and follow-up fit together.</p>
            <Link to="/industries/cleaning" className="text-sm font-semibold text-nx-purple-light hover:text-white">Open Cleaning workflows →</Link>
          </aside>
        </div>
      </div>
    </main>
  </>
}
