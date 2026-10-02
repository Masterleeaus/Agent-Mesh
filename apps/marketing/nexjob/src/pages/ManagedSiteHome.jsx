import PageMeta from '../components/PageMeta'
import SectionLabel from '../components/SectionLabel'

const stages = [
  ['Assessment', 'Understand the operating context, desired outcomes, existing systems and constraints before defining work.'],
  ['Implementation', 'Agree the scope, configure approved capabilities and connect only the systems included in the proposal.'],
  ['Ongoing management', 'Maintain and improve the agreed environment under documented permissions, review points and service terms.'],
]

export default function ManagedSiteHome() {
  return <>
    <PageMeta title="Titan Zero Managed Services" description="Assessment, implementation and ongoing management services for the Titan Zero platform." />
    <main>
      <section className="relative pt-36 pb-20 px-6 overflow-hidden"><div className="absolute -top-48 left-1/2 -translate-x-1/2 w-[800px] h-[800px] hero-glow pointer-events-none"/><div className="relative z-10 max-w-5xl mx-auto text-center"><SectionLabel>Titan Zero Managed Services</SectionLabel><h1 className="text-4xl sm:text-6xl font-extrabold mb-5">Assessment, implementation and ongoing management.</h1><p className="text-lg text-nx-muted max-w-3xl mx-auto leading-relaxed">Titan Zero Managed Services works with a business to understand its needs, scope an implementation, integrate agreed systems and manage the approved environment over time. Scope, availability and terms are confirmed before any engagement.</p></div></section>

      <section id="what-we-manage" className="px-6 pb-20"><div className="max-w-6xl mx-auto"><SectionLabel>What .pro manages</SectionLabel><h2 className="text-3xl sm:text-4xl font-extrabold mb-8">A scoped service around the platform.</h2><div className="grid md:grid-cols-3 gap-5">{stages.map(([title, description]) => <article key={title} className="bg-nx-surface border border-nx-border rounded-2xl p-7"><h3 className="text-xl font-bold mb-3">{title}</h3><p className="text-sm text-nx-muted leading-relaxed">{description}</p></article>)}</div></div></section>

      <section id="assessment" className="py-20 px-6 border-y border-nx-border"><div className="max-w-5xl mx-auto"><SectionLabel>Assessment & implementation</SectionLabel><h2 className="text-3xl sm:text-4xl font-extrabold mb-5">Begin with the operating reality.</h2><p className="text-nx-muted leading-relaxed">An assessment is used to establish the requested scope, relevant people and systems, delivery dependencies and constraints. Implementation starts only after scope, authority, access and commercial terms are agreed.</p></div></section>

      <section id="pricing" className="px-6 py-20"><div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-5"><article className="bg-nx-surface border border-nx-border rounded-2xl p-8"><SectionLabel>Service packages & pricing</SectionLabel><h2 className="text-2xl font-bold mb-3">Scope and pricing are confirmed in a proposal.</h2><p className="text-sm text-nx-muted leading-relaxed">No fixed package price is published in this preview. A proposal must state the agreed deliverables, implementation effort, ongoing service, exclusions and any third-party costs.</p></article><article id="case-studies" className="bg-nx-surface border border-nx-border rounded-2xl p-8"><SectionLabel>Case studies</SectionLabel><h2 className="text-2xl font-bold mb-3">No approved case studies are published here.</h2><p className="text-sm text-nx-muted leading-relaxed">Customer stories and measured outcomes require verified evidence and permission to publish. This preview does not substitute donor testimonials or illustrative figures.</p></article></div></section>

      <section id="faq" className="px-6 pb-20"><div className="max-w-6xl mx-auto bg-nx-surface border border-nx-border rounded-2xl p-8"><SectionLabel>FAQs</SectionLabel><h2 className="text-2xl font-bold mb-3">Questions about a managed engagement?</h2><p className="text-sm text-nx-muted leading-relaxed">Engagement-specific answers belong in the approved scope and proposal. Product and architecture information remains on the Titan Zero platform site.</p><a href="https://titanzero.io/resources" className="inline-block mt-5 text-sm text-nx-purple-light hover:text-white">Platform resources →</a></div></section>

      <section id="assessment-request" className="px-6 pb-24"><div className="max-w-5xl mx-auto text-center rounded-2xl border border-nx-border bg-nx-surface p-9"><SectionLabel>Assessment request</SectionLabel><h2 className="text-3xl font-extrabold mb-3">Request an assessment</h2><p className="text-sm text-nx-muted max-w-2xl mx-auto mb-6">The request workflow is not connected in this preview, so it cannot accept or confirm submissions.</p><button type="button" disabled aria-disabled="true" className="rounded-lg bg-nx-purple px-6 py-3 text-sm font-semibold text-white opacity-60 cursor-not-allowed">Requests unavailable in preview</button></div></section>
    </main>
  </>
}
