import { Link } from 'react-router-dom'
import PageMeta from '../components/PageMeta'
import SectionLabel from '../components/SectionLabel'
import { APP_ACCESS_AVAILABLE, appRoutes } from '../config'

const cleaningServices = [
  'Regular, one-off and deep cleans',
  'End-of-lease and move-in / move-out cleans',
  'Short-stay turnovers',
  'Commercial and office cleaning',
  'Carpet, upholstery and window cleaning',
  'Pressure, post-construction and custom cleaning',
]

const launchWorkflows = [
  ['Enquiry & scope', 'Capture property type, rooms or zones, access needs, frequency and service priorities.'],
  ['Quote & booking', 'Shape a quote from the agreed scope, then coordinate the booking and service window.'],
  ['Crew & job', 'Keep crew skills, visit details, room tasks and checklist progress connected to each clean.'],
  ['Quality & follow-up', 'Record exceptions and evidence, prepare completion for invoice review, and keep rework or rebooking context.'],
]

export default function PlatformHubHome() {
  return <>
    <PageMeta title="Cleaning SaaS" description="Titan Zero is a Cleaning SaaS in development, with detailed cleaning service models and workflows for residential, short-stay and commercial teams." />
    <main>
      <section id="how-it-works" className="relative pt-36 pb-24 px-6 overflow-hidden">
        <div className="absolute -top-48 left-1/2 -translate-x-1/2 w-[800px] h-[800px] hero-glow pointer-events-none" />
        <div className="relative z-10 max-w-6xl mx-auto text-center">
          <SectionLabel>Titan Zero Cleaning</SectionLabel>
          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-black leading-[1.05] tracking-tight mb-6">Cleaning work, connected from enquiry to follow-up.</h1>
          <p className="text-lg text-nx-muted max-w-3xl mx-auto mb-9 leading-relaxed">Titan Zero is being built for cleaning businesses: bring service scope, recurring visits, crews, room and site checklists, quality evidence, invoice readiness and customer follow-up into one connected operating system. A substantial Cleaning implementation and test suite already exist in the codebase; this review build does not represent a production release.</p>
          <div className="flex justify-center gap-4 flex-wrap">
            <Link to="/industries/cleaning" className="inline-flex items-center justify-center rounded-lg bg-nx-purple hover:bg-nx-purple-dark px-6 py-3 text-sm font-semibold text-white">Explore Cleaning workflows</Link>
            <Link to="/works-everywhere" className="inline-flex items-center justify-center rounded-lg border border-nx-border px-6 py-3 text-sm font-semibold">Works Everywhere</Link>
            {APP_ACCESS_AVAILABLE && <a href={appRoutes.login} className="inline-flex items-center justify-center rounded-lg border border-nx-border px-6 py-3 text-sm font-semibold">Sign in</a>}
          </div>
        </div>
      </section>

      <section id="features" className="px-6 py-20 border-y border-nx-border">
        <div className="max-w-6xl mx-auto">
          <SectionLabel>Cleaning vertical · in development</SectionLabel>
          <h2 className="text-3xl sm:text-4xl font-extrabold mb-5">Built around the work cleaning teams already do.</h2>
          <p className="text-nx-muted leading-relaxed max-w-3xl mb-8">The current source models 14 cleaning service variants and a connected workflow blueprint. The stages and examples below describe implementation work in progress; they are not a claim that a customer deployment is available.</p>
          <ul className="grid sm:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-4">
            {cleaningServices.map((service) => <li key={service} className="border-b border-nx-border py-3 text-sm text-nx-muted">{service}</li>)}
          </ul>
        </div>
      </section>

      <section className="px-6 py-24">
        <div className="max-w-6xl mx-auto">
          <div className="grid lg:grid-cols-[0.8fr_1.2fr] gap-10 items-end mb-10">
            <div><SectionLabel>How it works</SectionLabel><h2 className="text-3xl sm:text-4xl font-extrabold">One cleaning workflow, with clear human review.</h2></div>
            <p className="text-nx-muted leading-relaxed">The Cleaning blueprint links existing shared Titan owners for onboarding, leads, quotes, booking, scheduling, workforce assignment, jobs, evidence, quality, invoices, payment reconciliation and rebooking. It keeps proposal generation separate from authority to execute; business actions still require the correct approval and production readiness.</p>
          </div>
          <ol className="grid md:grid-cols-2 xl:grid-cols-4 gap-5">{launchWorkflows.map(([title, description], index) => <li key={title} className="border-t border-nx-border pt-5"><p className="text-xs font-bold text-nx-purple-light mb-3">{String(index + 1).padStart(2, '0')}</p><h3 className="font-bold mb-2">{title}</h3><p className="text-sm text-nx-muted leading-relaxed">{description}</p></li>)}</ol>
        </div>
      </section>

      <section className="px-6 py-20 border-y border-nx-border bg-nx-surface/40">
        <div className="max-w-6xl mx-auto grid lg:grid-cols-2 gap-8">
          <article className="border-t border-nx-border pt-6">
            <SectionLabel>Works Everywhere</SectionLabel>
            <h2 className="text-2xl font-bold mb-3">See which work surfaces are in development.</h2>
            <p className="text-sm text-nx-muted leading-relaxed mb-5">Mobile, PWA, browser, WordPress, ChatGPT and messaging availability is stated separately, based on current source and release evidence.</p>
            <Link to="/works-everywhere" className="text-sm font-semibold text-nx-purple-light hover:text-white">Check all work surfaces →</Link>
          </article>
          <article className="border-t border-nx-border pt-6">
            <SectionLabel>Managed service</SectionLabel>
            <h2 className="text-2xl font-bold mb-3">Get help implementing the system.</h2>
            <p className="text-sm text-nx-muted leading-relaxed mb-5">The managed-service offer remains part of Titan Zero and has its own page on this site.</p>
            <Link to="/fully-managed" className="text-sm font-semibold text-nx-purple-light hover:text-white">Explore managed service →</Link>
          </article>
        </div>
      </section>

      <section className="px-6 py-20">
        <div className="max-w-6xl mx-auto flex flex-wrap items-center justify-between gap-6 border-t border-nx-border pt-7">
          <div><SectionLabel>Next</SectionLabel><h2 className="text-2xl font-bold">Explore the Cleaning workflow details.</h2></div>
          <div className="flex flex-wrap gap-5"><Link to="/industries/cleaning" className="text-sm text-nx-purple-light hover:text-white">Cleaning workflows →</Link><Link to="/features" className="text-sm text-nx-purple-light hover:text-white">Features →</Link><Link to="/ai-workforce" className="text-sm text-nx-purple-light hover:text-white">AI workforce →</Link><Link to="/pricing" className="text-sm text-nx-purple-light hover:text-white">Pricing →</Link><Link to="/resources" className="text-sm text-nx-purple-light hover:text-white">Resources →</Link></div>
        </div>
      </section>
    </main>
  </>
}
