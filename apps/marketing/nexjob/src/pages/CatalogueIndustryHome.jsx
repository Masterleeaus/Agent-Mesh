import PageMeta from '../components/PageMeta'
import SectionLabel from '../components/SectionLabel'
import { ButtonPrimary, ButtonOutline } from '../components/Button'
import { APP_SIGNUP_AVAILABLE, appRoutes } from '../config'
import { getAvailability, verticalCatalogue } from '../data/verticalCatalogue'

function Status({ offer }) {
  const text = offer.context ? `${offer.context}: ${offer.label}` : offer.label
  return <span className="inline-flex rounded-full border border-nx-purple/30 bg-nx-purple/10 px-3 py-1 text-xs font-semibold text-nx-purple-light">{text}</span>
}

function Examples({ items }) {
  return <ul className="mt-4 space-y-3">{items.map((item) => <li key={item} className="text-sm text-nx-muted leading-relaxed">{item}</li>)}</ul>
}

export default function CatalogueIndustryHome({ profile }) {
  const marketingState = getAvailability(profile.marketingAvailabilityRef)
  const runtimeState = getAvailability(profile.runtimeAvailabilityRef)
  const channelNames = { whatsappWorkChannel: 'WhatsApp', telegramWorkChannel: 'Telegram', facebookMessengerWorkChannel: 'Facebook Messenger' }
  const channelOffers = profile.platformAvailabilityRefs.messagingChannels.map((id) => ({ ...getAvailability(id), context: channelNames[id] }))

  return <>
    <PageMeta title={`${profile.name} Workflows`} description={profile.intro} />
    <main>
      <section className="relative pt-32 pb-20 px-6 overflow-hidden">
        <div className="absolute -top-48 left-1/2 -translate-x-1/2 w-[800px] h-[800px] hero-glow pointer-events-none" />
        <div className="relative z-10 max-w-7xl mx-auto grid lg:grid-cols-[1.1fr_0.9fr] gap-12 xl:gap-20 items-center">
          <div>
            <div className="text-xs font-bold tracking-[0.16em] uppercase text-nx-purple-light mb-5">{profile.group} · Titan Zero</div>
            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-black leading-[1.02] tracking-tight mb-6">Titan Zero for {profile.name} teams.<br /><span className="text-nx-purple-light">Run the work with clearer next steps.</span></h1>
            <p className="text-lg text-nx-muted max-w-2xl mb-7 leading-relaxed">{profile.intro}</p>
            <div className="flex gap-3 flex-wrap mb-7"><Status offer={{ ...marketingState, context: 'Marketing' }} /><Status offer={{ ...getAvailability(profile.hostnameAvailabilityRef), context: 'Vertical host' }} /><Status offer={{ ...runtimeState, context: 'Runtime' }} /></div>
            <div className="flex flex-wrap gap-4">
              <ButtonPrimary size="lg" href={appRoutes.signup} disabled={!APP_SIGNUP_AVAILABLE}>Access unavailable</ButtonPrimary>
              <ButtonOutline size="lg" href="#workflows">Explore workflow examples</ButtonOutline>
            </div>
            <p className="text-xs text-nx-muted2 mt-6">Review preview · examples describe intended workflows; no live runtime or installation is represented.</p>
          </div>
          <aside className="relative rounded-3xl border border-nx-border bg-nx-surface/90 p-5 sm:p-7 shadow-2xl" aria-label={`${profile.name} work journey example`}>
            <div className="flex items-start justify-between gap-4 border-b border-nx-border pb-5 mb-4">
              <div><p className="text-xs font-bold uppercase tracking-[0.15em] text-nx-purple-light mb-2">Work journey</p><h2 className="text-2xl font-bold">A connected view of the job.</h2></div>
              <span className="rounded-full border border-nx-border2 px-3 py-1 text-[11px] text-nx-muted whitespace-nowrap">Illustrative</span>
            </div>
            <ol className="space-y-2">
              {profile.workflow.slice(0, 4).map(([title, description], index) => <li key={title} className="flex gap-4 rounded-2xl border border-nx-border bg-nx-bg/70 p-4">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-nx-purple/40 bg-nx-purple/10 text-xs font-bold text-nx-purple-light">{String(index + 1).padStart(2, '0')}</span>
                <div><h3 className="font-semibold mb-1">{title}</h3><p className="text-xs text-nx-muted leading-relaxed">{description}</p></div>
              </li>)}
            </ol>
            <a href="#workflows" className="mt-5 inline-flex text-sm font-semibold text-nx-purple-light hover:text-white">See the full workflow <span aria-hidden="true" className="ml-2">↓</span></a>
          </aside>
        </div>
      </section>

      <section id="workflows" className="py-20 px-6 border-y border-nx-border">
        <div className="max-w-7xl mx-auto">
          <SectionLabel>{profile.name} workflow</SectionLabel>
          <h2 className="text-4xl sm:text-5xl font-extrabold mb-4">From the first enquiry through work history.</h2>
          <p className="text-nx-muted max-w-3xl mb-9">A marketing description of the work journey. Production workflows depend on the shared application and an approved implementation.</p>
          <ol className="grid sm:grid-cols-2 xl:grid-cols-5 gap-4">{profile.workflow.map(([title, description], index) => <li key={title} className="bg-nx-surface border border-nx-border rounded-2xl p-6"><p className="text-xs font-bold text-nx-purple-light mb-3">{String(index + 1).padStart(2, '0')}</p><h3 className="font-bold mb-2">{title}</h3><p className="text-sm text-nx-muted leading-relaxed">{description}</p></li>)}</ol>
        </div>
      </section>

      <section id="features" className="py-24 px-6">
        <div className="max-w-7xl mx-auto">
          <SectionLabel>Cleaning service types</SectionLabel>
          <h2 className="text-4xl sm:text-5xl font-extrabold mb-4">Examples for {profile.name.toLowerCase()} work.</h2>
          <p className="text-nx-muted max-w-3xl mb-9">The catalogue models these Cleaning use cases. Production workflows remain in development and require a verified company deployment.</p>
          <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">{profile.useCases.map(([id, title, description]) => <article key={id} className="bg-nx-surface border border-nx-border rounded-2xl p-6"><h3 className="font-bold mb-2">{title}</h3><p className="text-sm text-nx-muted leading-relaxed">{description}</p></article>)}</div>
        </div>
      </section>

      {profile.legacyContent && <section className="py-20 px-6 border-y border-nx-border">
        <div className="max-w-7xl mx-auto"><SectionLabel>Combined legacy content</SectionLabel><h2 className="text-3xl sm:text-4xl font-extrabold mb-8">Handyman and property maintenance scope.</h2>
          <div className="grid lg:grid-cols-2 gap-5">{Object.entries(profile.legacyContent).map(([id, legacy]) => <article key={id} className="bg-nx-surface border border-nx-border rounded-2xl p-7"><h3 className="text-xl font-bold mb-2">{legacy.name}</h3><h4 className="font-semibold mb-3">{legacy.headline}</h4><p className="text-sm text-nx-muted leading-relaxed">{legacy.intro}</p>{legacy.examples?.length > 0 && <Examples items={legacy.examples.map(([title, description]) => `${title}: ${description}`)} />}{legacy.capabilities?.length > 0 && <Examples items={legacy.capabilities.map(([title, description]) => `${title}: ${description}`)} />}</article>)}</div>
        </div>
      </section>}

      <section id="wordpress" className="py-20 px-6 border-y border-nx-border">
        <div className="max-w-7xl mx-auto grid md:grid-cols-2 gap-8"><article className="bg-nx-surface border border-nx-border rounded-2xl p-7"><div className="flex flex-wrap items-center justify-between gap-3 mb-4"><h2 className="text-2xl font-bold">WordPress</h2><Status offer={getAvailability(profile.wordpressContent.availabilityRef)} /></div><p className="text-sm text-nx-muted leading-relaxed">{profile.wordpressContent.summary}</p><Examples items={profile.wordpressContent.examples} /><p className="text-xs text-nx-muted2 mt-5">No per-vertical WordPress install package is available from this preview.</p></article>
          <article id="chrome" className="bg-nx-surface border border-nx-border rounded-2xl p-7"><div className="flex flex-wrap items-center justify-between gap-3 mb-4"><h2 className="text-2xl font-bold">Chrome</h2><Status offer={getAvailability(profile.chromeContent.availabilityRef)} /></div><p className="text-sm text-nx-muted leading-relaxed">{profile.chromeContent.summary}</p><Examples items={profile.chromeContent.examples} /><p className="text-xs text-nx-muted2 mt-5">No per-vertical Chrome install package is available from this preview.</p></article>
        </div>
      </section>

      <section id="channels" className="py-20 px-6">
        <div className="max-w-7xl mx-auto"><SectionLabel>Access & channels</SectionLabel><h2 className="text-3xl sm:text-4xl font-extrabold mb-4">Work surfaces for the people doing the work.</h2><p className="text-sm text-nx-muted leading-relaxed mb-8 max-w-3xl">The role examples below are catalogue scenarios for owners, staff and customers. They do not claim a live communications integration.</p>
          <div className="grid md:grid-cols-2 gap-5 mb-8"><article className="bg-nx-surface border border-nx-border rounded-2xl p-7"><h3 className="font-bold mb-2">Owners and staff</h3><p className="text-sm text-nx-muted leading-relaxed">{profile.workChannelContent.ownerAndStaff}</p></article><article className="bg-nx-surface border border-nx-border rounded-2xl p-7"><h3 className="font-bold mb-2">Customers</h3><p className="text-sm text-nx-muted leading-relaxed">{profile.workChannelContent.customer}</p></article></div>
          <div className="grid sm:grid-cols-3 gap-4">{channelOffers.map((offer) => <article key={offer.context} className="bg-nx-surface border border-nx-border rounded-xl p-5"><div className="flex items-center justify-between gap-3"><h3 className="font-semibold">{offer.context}</h3><Status offer={offer} /></div><p className="text-xs text-nx-muted mt-3">Availability is verified per provider and release; this catalogue entry includes no connection or sign-in workflow.</p></article>)}</div>
          <a href="/works-everywhere" className="inline-block mt-7 text-sm text-nx-purple-light">See all work surfaces →</a>
        </div>
      </section>

      <section className="py-20 px-6 border-y border-nx-border">
        <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-8"><article className="bg-nx-surface border border-nx-border rounded-2xl p-8"><SectionLabel>Platform</SectionLabel><h2 className="text-2xl font-bold mb-3">A shared Titan Zero product foundation.</h2><p className="text-sm text-nx-muted leading-relaxed mb-5">Explore the product platform and its current release state.</p><a href="https://titanzero.io/" className="text-sm font-semibold text-nx-purple-light">Titan Zero platform →</a></article><article className="bg-nx-surface border border-nx-border rounded-2xl p-8"><SectionLabel>Availability</SectionLabel><h2 className="text-2xl font-bold mb-3">Check current work surfaces.</h2><p className="text-sm text-nx-muted leading-relaxed mb-5">Release state and installation availability are shown for each surface.</p><a href="/works-everywhere" className="text-sm font-semibold text-nx-purple-light">See work surfaces →</a></article></div>
      </section>

      
    </main>
  </>
}

export function getCatalogueIndustryProfile(id) {
  return verticalCatalogue.find((profile) => profile.id === id) || null
}
