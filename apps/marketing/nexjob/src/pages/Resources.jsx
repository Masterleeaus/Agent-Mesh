import { Link } from 'react-router-dom'
import PageMeta from '../components/PageMeta'
import SectionLabel from '../components/SectionLabel'

const resources = [
  ['Cleaning system features', '/features', 'CRM, quotes, bookings, scheduling, jobs, evidence, invoices, equipment and customer care.'],
  ['AI workforce', '/ai-workforce', 'The six specialist roles supporting a cleaning operation.'],
  ['WordPress plugins', '/wordpress-plugins', 'Five separate products with AI Assist.'],
  ['Chrome extensions', '/chrome-extensions', 'Five separate browser products with AI Assist.'],
  ['Works Everywhere', '/works-everywhere', 'Mobile, PWA, ChatGPT and messaging channels for owners, staff and customers.'],
  ['What is Titan Zero?', '/titan-zero', 'How the workforce and business system are coordinated.'],
  ['Frequently asked questions', '/faq', 'Answers about setup, channels, safety, AI Assist and plans.'],
  ['Managed service', '/fully-managed', 'Implementation and ongoing system management for cleaning businesses.'],
]

export default function Resources() {
  return <>
    <PageMeta title="Cleaning Product Resources" description="Guides to the Cleaning system, AI workforce, plugins, extensions, channels, plans and managed service." />
    <main className="pt-32 pb-24 px-6"><div className="max-w-6xl mx-auto"><SectionLabel>Resources</SectionLabel><h1 className="text-4xl sm:text-5xl font-extrabold mb-5">Find the part of the Cleaning system you need.</h1><p className="text-lg text-nx-muted max-w-3xl mb-9">Explore the workforce, operating workflows and ways your team can connect to the system.</p><div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">{resources.map(([label, href, description]) => <Link key={href} to={href} className="bg-nx-surface border border-nx-border rounded-xl p-6 hover:border-nx-purple"><h2 className="font-bold mb-2">{label} →</h2><p className="text-sm text-nx-muted leading-relaxed">{description}</p></Link>)}</div></div></main>
  </>
}
