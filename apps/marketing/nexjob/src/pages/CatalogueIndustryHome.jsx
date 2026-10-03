import { Link } from 'react-router-dom'
import PageMeta from '../components/PageMeta'
import SectionLabel from '../components/SectionLabel'
import { ButtonPrimary, ButtonOutline } from '../components/Button'
import { APP_SIGNUP_AVAILABLE, appRoutes } from '../config'

export default function CatalogueIndustryHome({ profile }) {
  const isCleaning = profile.id === 'cleaning'
  return <>
    <PageMeta title={`${profile.name} Workforce & System`} description={`A connected cleaning workforce and business workflow for ${profile.name.toLowerCase()} teams.`} />
    <main>
      <section className="relative pt-32 pb-20 px-6 overflow-hidden">
        <div className="absolute -top-48 left-1/2 -translate-x-1/2 w-[800px] h-[800px] hero-glow pointer-events-none" />
        <div className="relative z-10 max-w-7xl mx-auto grid lg:grid-cols-[1.1fr_0.9fr] gap-12 xl:gap-20 items-center">
          <div>
            <div className="text-xs font-bold tracking-[0.16em] uppercase text-nx-purple-light mb-5">Cleaning workforce & business system</div>
            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-black leading-[1.02] tracking-tight mb-6">One connected workflow for {profile.name.toLowerCase()} teams.</h1>
            <p className="text-lg text-nx-muted max-w-2xl mb-7 leading-relaxed">Connect the customer, property, service scope, quote, recurring booking, crew, checklist, completion evidence, invoice and follow-up. Your team can see the next step without losing the details already agreed.</p>
            <div className="flex flex-wrap gap-4 mb-6">
              <ButtonPrimary size="lg" href={appRoutes.signup} disabled={!APP_SIGNUP_AVAILABLE}>Sign up for Cleaning</ButtonPrimary>
              <ButtonOutline size="lg" href="#workflows">See how it works</ButtonOutline>
            </div>
            <p className="text-sm text-nx-muted">Titan Zero manages the workforce and system behind the operation. <Link to="/titan-zero" className="text-nx-purple-light">Learn what that means →</Link></p>
          </div>
          <aside className="relative rounded-3xl border border-nx-border bg-nx-surface/90 p-5 sm:p-7 shadow-2xl" aria-label="Cleaning work journey">
            <div className="border-b border-nx-border pb-5 mb-4"><p className="text-xs font-bold uppercase tracking-[0.15em] text-nx-purple-light mb-2">Cleaning work journey</p><h2 className="text-2xl font-bold">Every handoff stays with the job.</h2></div>
            <ol className="space-y-2">
              {profile.workflow.map(([title, description], index) => <li key={title} className="flex gap-4 rounded-2xl border border-nx-border bg-nx-bg/70 p-4"><span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-nx-purple/40 bg-nx-purple/10 text-xs font-bold text-nx-purple-light">{String(index + 1).padStart(2, '0')}</span><div><h3 className="font-semibold mb-1">{title}</h3><p className="text-xs text-nx-muted leading-relaxed">{description}</p></div></li>)}
            </ol>
          </aside>
        </div>
      </section>

      <section id="workflows" className="py-20 px-6 border-y border-nx-border">
        <div className="max-w-7xl mx-auto">
          <SectionLabel>How it works</SectionLabel>
          <h2 className="text-4xl sm:text-5xl font-extrabold mb-4">From the first enquiry to the next clean.</h2>
          <p className="text-nx-muted max-w-3xl mb-9">Keep scope, customer decisions, visit details, work evidence and payment state connected as the service moves through the business.</p>
          <ol className="grid sm:grid-cols-2 xl:grid-cols-4 gap-4">{profile.workflow.map(([title, description], index) => <li key={title} className="bg-nx-surface border border-nx-border rounded-2xl p-6"><p className="text-xs font-bold text-nx-purple-light mb-3">{String(index + 1).padStart(2, '0')}</p><h3 className="font-bold mb-2">{title}</h3><p className="text-sm text-nx-muted leading-relaxed">{description}</p></li>)}</ol>
        </div>
      </section>

      <section id="features" className="py-24 px-6">
        <div className="max-w-7xl mx-auto">
          <SectionLabel>Cleaning service types</SectionLabel>
          <h2 className="text-4xl sm:text-5xl font-extrabold mb-4">Services configured around the work.</h2>
          <p className="text-nx-muted max-w-3xl mb-9">Choose services, scope, pricing, skills, equipment and checklists for your company. Specialist work appears only when its prerequisites are met.</p>
          <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">{profile.useCases.map(([id, title, description]) => <article key={id} className="bg-nx-surface border border-nx-border rounded-2xl p-6"><h3 className="font-bold mb-2">{title}</h3><p className="text-sm text-nx-muted leading-relaxed">{description}</p></article>)}</div>
          {isCleaning && <p className="mt-8 text-sm text-nx-muted leading-relaxed">Active construction-site work requires site access, induction and hazard review. Medical-equipment cleaning requires verified procedures, skills, equipment and review. Removal work stays within authorized item categories; hazardous and regulated waste is gated.</p>}
        </div>
      </section>

      <section id="wordpress" className="py-20 px-6 border-y border-nx-border bg-nx-surface/30">
        <div className="max-w-7xl mx-auto">
          <SectionLabel>Works Everywhere</SectionLabel>
          <h2 className="text-3xl sm:text-4xl font-extrabold mb-8">Use the workflow where your team works.</h2>
          <div className="grid md:grid-cols-2 gap-5">
            <article className="bg-nx-bg border border-nx-border rounded-2xl p-7"><h3 className="text-2xl font-bold mb-3">Five WordPress plugins</h3><p className="text-sm text-nx-muted leading-relaxed mb-5">Separate products for Bookings, Invoicing, Job Management, Quotes and CRM, each with AI Assist.</p><Link to="/wordpress-plugins" className="text-sm font-semibold text-nx-purple-light">See WordPress plugins →</Link></article>
            <article className="bg-nx-bg border border-nx-border rounded-2xl p-7"><h3 className="text-2xl font-bold mb-3">Five Chrome extensions</h3><p className="text-sm text-nx-muted leading-relaxed mb-5">Separate products for Bookings, Invoicing, Job Management, Quotes and CRM, each with AI Assist.</p><Link to="/chrome-extensions" className="text-sm font-semibold text-nx-purple-light">See Chrome extensions →</Link></article>
            <article className="bg-nx-bg border border-nx-border rounded-2xl p-7"><h3 className="text-xl font-bold mb-3">Apps and AI channels</h3><p className="text-sm text-nx-muted leading-relaxed mb-5">Mobile, PWA, ChatGPT, WhatsApp, Telegram and Facebook Messenger support owners, staff and customer conversations.</p><Link to="/works-everywhere" className="text-sm font-semibold text-nx-purple-light">View every work surface →</Link></article>
            <article className="bg-nx-bg border border-nx-border rounded-2xl p-7"><h3 className="text-xl font-bold mb-3">The operating system</h3><p className="text-sm text-nx-muted leading-relaxed mb-5">Connect CRM, service setup, quotes, bookings, teams, visits, evidence, invoices and customer care.</p><Link to="/features" className="text-sm font-semibold text-nx-purple-light">Explore system features →</Link></article>
          </div>
        </div>
      </section>
    </main>
  </>
}
