import { Link } from 'react-router-dom'
import PageMeta from '../components/PageMeta'
import SectionLabel from '../components/SectionLabel'
import { ButtonPrimary } from '../components/Button'
import { APP_SIGNUP_AVAILABLE, appRoutes } from '../config'

const segments = [
  ['Property managers & real estate', 'Find local property managers, agencies and real-estate offices that may need turnover, move-in, move-out or recurring cleaning.'],
  ['Strata & building managers', 'Build a sourced list of multi-unit, shared-area and building-management prospects in your service areas.'],
  ['Offices & commercial sites', 'Discover offices and local commercial businesses, including clinics and other professional premises.'],
  ['Short-stay operators', 'Identify accommodation and short-stay businesses with cleaning needs between guest stays.'],
  ['Specialist cleaning work', 'Search selected areas for opportunities related to windows, pressure washing, rubbish removal, organising and post-construction cleaning.'],
]

const steps = [
  ['Choose your patch', 'Select service areas, cleaning categories and search cadence for approved business sources.'],
  ['Collect sourced prospects', 'Scheduled discovery and uploaded lists create candidate records with source, time observed and available business details.'],
  ['Review the candidate queue', 'Check the source, clean up duplicates, reject irrelevant results or promote a suitable candidate to your prospect pool.'],
  ['Decide what happens next', 'Use the eligible prospect in your sales or marketing workflow only after contact permissions and company policies are checked.'],
]

export default function LeadGeneration() {
  return <>
    <PageMeta title="Cleaning Lead Generation System" description="Discover local cleaning prospects from approved sources, import call lists, review and deduplicate candidates and prepare eligible outreach in one connected system." />
    <main>
      <section className="relative pt-32 pb-20 px-6 overflow-hidden">
        <div className="absolute -top-48 left-1/2 -translate-x-1/2 w-[760px] h-[760px] hero-glow pointer-events-none" />
        <div className="relative z-10 max-w-5xl mx-auto text-center">
          <SectionLabel>Lead generation for Cleaning</SectionLabel>
          <h1 className="text-4xl sm:text-6xl font-extrabold mb-5">Find more cleaning opportunities in your service area.</h1>
          <p className="text-lg text-nx-muted max-w-3xl mx-auto leading-relaxed">Build a sourced, reviewable pool of local businesses and service opportunities. Use scheduled discovery or bring your own call lists, then move suitable prospects into the Cleaning sales workflow.</p>
          <div className="mt-8 flex justify-center flex-wrap gap-5">
            <ButtonPrimary href={appRoutes.signup} disabled={!APP_SIGNUP_AVAILABLE}>Get started</ButtonPrimary>
            <Link to="/pricing#lead-generation" className="inline-flex items-center text-sm font-semibold text-nx-purple-light hover:text-white">Lead Generation: A$79/month →</Link>
          </div>
        </div>
      </section>

      <section className="px-6 pb-20">
        <div className="max-w-6xl mx-auto">
          <div className="max-w-3xl mb-10">
            <SectionLabel>Cleaning prospect segments</SectionLabel>
            <h2 className="text-3xl sm:text-4xl font-extrabold mb-4">Search for the work your team wants to win.</h2>
            <p className="text-nx-muted leading-relaxed">Configure search areas and business categories around the cleaning services you offer, then see the source details and candidate status before a person decides to follow up.</p>
          </div>
          <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
            {segments.map(([title, description], index) => <article key={title} className="border border-nx-border rounded-2xl bg-nx-surface p-6"><p className="text-xs font-bold text-nx-purple-light mb-3">SEGMENT 0{index + 1}</p><h3 className="text-lg font-bold mb-2">{title}</h3><p className="text-sm text-nx-muted leading-relaxed">{description}</p></article>)}
          </div>
        </div>
      </section>

      <section className="px-6 py-20 border-y border-nx-border bg-nx-surface/30">
        <div className="max-w-6xl mx-auto">
          <SectionLabel>One prospect pool</SectionLabel>
          <h2 className="text-3xl sm:text-4xl font-extrabold mb-9">Keep every source and decision with the lead.</h2>
          <ol className="grid md:grid-cols-2 xl:grid-cols-4 gap-5">
            {steps.map(([title, description], index) => <li key={title} className="border-t border-nx-border pt-5"><p className="text-xs font-bold text-nx-purple-light mb-3">{String(index + 1).padStart(2, '0')}</p><h3 className="font-bold mb-2">{title}</h3><p className="text-sm text-nx-muted leading-relaxed">{description}</p></li>)}
          </ol>
        </div>
      </section>

      <section className="px-6 py-20">
        <div className="max-w-6xl mx-auto grid lg:grid-cols-2 gap-8">
          <article className="border border-nx-border rounded-2xl bg-nx-surface p-7 sm:p-9">
            <SectionLabel>Scheduled local discovery</SectionLabel>
            <h2 className="text-2xl font-bold mb-4">Keep your prospect map fresh.</h2>
            <p className="text-sm text-nx-muted leading-relaxed">Set approved search phrases, business categories, locations, run cadence and per-company limits. Runs resume safely, show freshness and provider status, and deduplicate repeat observations against your existing prospects.</p>
            <p className="mt-4 text-sm text-nx-muted leading-relaxed">Each candidate keeps its source and observation details. Search availability, fields, quotas and retention depend on the connected data provider.</p>
          </article>
          <article className="border border-nx-border rounded-2xl bg-nx-surface p-7 sm:p-9">
            <SectionLabel>Import your own call lists</SectionLabel>
            <h2 className="text-2xl font-bold mb-4">Bring existing prospects into the same workflow.</h2>
            <p className="text-sm text-nx-muted leading-relaxed">Upload a CSV, map the columns, preview and correct the rows, then review likely duplicates before importing. Keep list source, import batch, field history and cleaning-service interest with each prospect.</p>
            <p className="mt-4 text-sm text-nx-muted leading-relaxed">An imported email address, phone number or list is not treated as permission to contact. No call, SMS, WhatsApp message or email goes out just because discovery found a business.</p>
          </article>
        </div>
      </section>

      <section className="px-6 pb-24">
        <div className="max-w-5xl mx-auto rounded-2xl border border-nx-border bg-nx-surface p-8 sm:p-10 text-center">
          <h2 className="text-2xl sm:text-3xl font-bold mb-4">Turn a suitable prospect into your next customer.</h2>
          <p className="text-sm text-nx-muted leading-relaxed mb-7">Review the opportunity, keep its provenance, check contact eligibility and then use the same sales, marketing and reception tools as the rest of your Cleaning operation.</p>
          <div className="flex justify-center flex-wrap gap-5">
            <ButtonPrimary href={appRoutes.signup} disabled={!APP_SIGNUP_AVAILABLE}>Start finding prospects</ButtonPrimary>
            <Link to="/marketing" className="inline-flex items-center text-sm font-semibold text-nx-purple-light hover:text-white">See the marketing system →</Link>
            <Link to="/reception" className="inline-flex items-center text-sm font-semibold text-nx-purple-light hover:text-white">See AI Reception →</Link>
          </div>
        </div>
      </section>
    </main>
  </>
}
