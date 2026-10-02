import { Link } from 'react-router-dom'
import PageMeta from '../components/PageMeta'
import SectionLabel from '../components/SectionLabel'
import { APP_ACCESS_AVAILABLE, appRoutes } from '../config'

const pillars = [
  ['One', 'A person with a role, relationships and authority in the work they do.'],
  ['Zero', 'Personal working intelligence shaped around that person and their authorised context.'],
  ['Team', 'Specialist capabilities and systems coordinated within the person’s role and approved scope.'],
]

const personalServiceExamples = [
  ['Enquiry and booking context', 'Bring a service request, preferred time and customer details together as an example of the context a business may need to review.'],
  ['The person providing the service', 'Show an owner or team member the customer, service notes and agreed next steps that relate to their role.'],
  ['Follow-through after a visit', 'Keep customer questions, service updates and future follow-up visible as part of an intended end-to-end journey.'],
]

const personalServiceIndustries = ['Hair salons', 'Barbers', 'Beauty', 'Nails', 'Massage', 'Spas', 'Personal trainers', 'Gyms & fitness', 'Wellness', 'Coaching']

export default function PlatformHubHome() {
  return <>
    <PageMeta title="Titan Zero Platform" description="Explore the Titan Zero platform, its product capabilities, work surfaces and industry catalogue." />
    <main>
      <section id="how-it-works" className="relative pt-36 pb-24 px-6 overflow-hidden">
        <div className="absolute -top-48 left-1/2 -translate-x-1/2 w-[800px] h-[800px] hero-glow pointer-events-none" />
        <div className="relative z-10 max-w-6xl mx-auto text-center">
          <SectionLabel>Titan Zero Platform</SectionLabel>
          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-black leading-[1.05] tracking-tight mb-6">A platform for people, systems and digital work.</h1>
          <p className="text-lg text-nx-muted max-w-3xl mx-auto mb-9 leading-relaxed">Titan Zero brings personal working intelligence, specialist capabilities and existing business systems into one governed product environment. Each feature and work surface shows its current release status.</p>
          <div className="flex justify-center gap-4 flex-wrap">
            <Link to="/works-everywhere" className="inline-flex items-center justify-center rounded-lg bg-nx-purple hover:bg-nx-purple-dark px-6 py-3 text-sm font-semibold text-white">See work surfaces</Link>
            {APP_ACCESS_AVAILABLE ? <a href={appRoutes.login} className="inline-flex items-center justify-center rounded-lg border border-nx-border px-6 py-3 text-sm font-semibold">Sign in</a> : <button type="button" disabled className="inline-flex items-center justify-center rounded-lg border border-nx-border px-6 py-3 text-sm font-semibold opacity-60 cursor-not-allowed">Sign in unavailable</button>}
          </div>
        </div>
      </section>

      <section className="px-6 py-20 border-y border-nx-border">
        <div className="max-w-6xl mx-auto">
          <SectionLabel>One + Zero + Team</SectionLabel>
          <h2 className="text-3xl sm:text-4xl font-extrabold mb-8">A shared product model, adapted to the person.</h2>
          <div className="grid md:grid-cols-3 gap-5">
            {pillars.map(([name, description]) => <article key={name} className="bg-nx-surface border border-nx-border rounded-2xl p-7"><h3 className="text-xl font-bold mb-3">{name}</h3><p className="text-sm text-nx-muted leading-relaxed">{description}</p></article>)}
          </div>
        </div>
      </section>

      <section className="px-6 py-24 border-y border-nx-border bg-nx-surface/40">
        <div className="max-w-6xl mx-auto">
          <div className="grid lg:grid-cols-[0.9fr_1.1fr] gap-10 items-end mb-10">
            <div><SectionLabel>Personal Services</SectionLabel><h2 className="text-3xl sm:text-4xl font-extrabold mb-4">Service work, connected to the people doing it.</h2></div>
            <p className="text-nx-muted leading-relaxed">Appointment-based and personal service businesses have their own customer relationships, schedules and follow-through. The examples below adapt useful parts of the Personal Services marketing source to the shared Titan Zero platform story. They describe intended workflows, not released features.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-4">
            {personalServiceExamples.map(([title, description]) => <article key={title} className="bg-nx-surface border border-nx-border rounded-2xl p-7"><h3 className="font-bold mb-3">{title}</h3><p className="text-sm text-nx-muted leading-relaxed">{description}</p></article>)}
          </div>
          <div className="mt-8 flex flex-wrap gap-2" aria-label="Personal Services industry examples">
            {personalServiceIndustries.map((industry) => <span key={industry} className="rounded-full border border-nx-border bg-nx-bg px-3 py-1.5 text-xs text-nx-muted">{industry}</span>)}
          </div>
          <div className="mt-8 flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-nx-border bg-nx-bg p-6">
            <p className="text-sm text-nx-muted">Implementation and ongoing management are covered on the separate service site.</p>
            <a href="https://titanzero.pro/" className="text-sm font-semibold text-nx-purple-light hover:text-white">Titan Zero Managed Services →</a>
          </div>
        </div>
      </section>

      <section className="px-6 py-20">
        <div className="max-w-6xl mx-auto grid lg:grid-cols-2 gap-8">
          <article className="bg-nx-surface border border-nx-border rounded-2xl p-8">
            <SectionLabel>Explore the platform</SectionLabel>
            <p className="text-nx-muted leading-relaxed mb-6">Review the product capabilities, AI workforce concepts, industry catalogue and work surfaces. Release states are shown explicitly; this preview does not claim any unverified install or live connection.</p>
            <div className="flex flex-wrap gap-3"><Link to="/features" className="text-sm text-nx-purple-light hover:text-white">Features →</Link><Link to="/ai-workforce" className="text-sm text-nx-purple-light hover:text-white">AI workforce →</Link><Link to="/industries" className="text-sm text-nx-purple-light hover:text-white">Industries →</Link><Link to="/resources" className="text-sm text-nx-purple-light hover:text-white">Resources →</Link></div>
          </article>
          <article className="bg-nx-surface border border-nx-border rounded-2xl p-8">
            <SectionLabel>Availability</SectionLabel>
            <h2 className="text-2xl font-bold mb-3">See the current work surfaces</h2>
            <p className="text-sm text-nx-muted leading-relaxed mb-5">Review each surface and its current release state. This preview does not claim an unverified install or live connection.</p>
            <Link to="/works-everywhere" className="text-sm font-semibold text-nx-purple-light hover:text-white">Explore availability →</Link>
          </article>
        </div>
      </section>
    </main>
  </>
}
