import { Link } from 'react-router-dom'
import PageMeta from '../components/PageMeta'
import SectionLabel from '../components/SectionLabel'

const resources = [
  ['Privacy & architecture', '/privacy-architecture'],
  ['Cost sovereignty', '/cost-sovereignty'],
  ['Security, evidence & recovery', '/security-recovery'],
  ['System evolution', '/changelog'],
]

export default function Resources() {
  return <>
    <PageMeta title="Resources" description="Titan Zero product and architecture resources." />
    <main className="pt-32 pb-24 px-6"><div className="max-w-6xl mx-auto"><SectionLabel>Resources</SectionLabel><h1 className="text-4xl sm:text-5xl font-extrabold mb-5">Product and architecture resources.</h1><p className="text-lg text-nx-muted max-w-3xl mb-9">These pages describe Titan Zero product concepts and architecture. Release availability is shown separately and should be verified before relying on a capability.</p><div className="grid sm:grid-cols-2 gap-4">{resources.map(([label, href]) => <Link key={href} to={href} className="bg-nx-surface border border-nx-border rounded-xl p-6 text-sm font-semibold hover:border-nx-purple">{label} →</Link>)}</div></div></main>
  </>
}
