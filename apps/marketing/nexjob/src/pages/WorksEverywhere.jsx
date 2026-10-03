import { Link } from 'react-router-dom'
import PageMeta from '../components/PageMeta'
import SectionLabel from '../components/SectionLabel'
import { getAvailability } from '../data/verticalCatalogue'

const surfaces = [
  { id: 'mobile-app', name: 'Mobile app', offer: 'nativeMobile' },
  { id: 'pwa', name: 'PWA', offer: 'pwa' },
  { id: 'chrome', name: 'Cleaning Chrome extensions', offer: 'chromeVerticalExtension', detailsHref: '/chrome-extensions' },
  { id: 'wordpress', name: 'Cleaning WordPress plugins', offer: 'wordpressVerticalPlugin', detailsHref: '/wordpress-plugins' },
  { id: 'chatgpt', name: 'ChatGPT integration', offer: 'chatGptApp' },
  { id: 'whatsapp', name: 'WhatsApp', offer: 'whatsappWorkChannel' },
  { id: 'telegram', name: 'Telegram', offer: 'telegramWorkChannel' },
  { id: 'messenger', name: 'Facebook Messenger', offer: 'facebookMessengerWorkChannel' },
]

function Status({ value }) {
  return <span className="inline-flex rounded-full border border-nx-purple/30 bg-nx-purple/10 px-3 py-1 text-xs font-semibold text-nx-purple-light">{value}</span>
}

export default function WorksEverywhere() {
  return <>
    <PageMeta title="Works Everywhere for Cleaning Teams" description="Check the evidence-based release state for Titan Zero Cleaning on mobile, PWA, Chrome, WordPress, ChatGPT, WhatsApp, Telegram and Facebook Messenger." />
    <main>
      <section className="pt-32 pb-14 px-6 text-center"><div className="max-w-5xl mx-auto"><SectionLabel>Works Everywhere</SectionLabel><h1 className="text-4xl sm:text-6xl font-extrabold mb-5">Use Titan Zero where cleaning work happens.</h1><p className="text-lg text-nx-muted max-w-3xl mx-auto">The goal is for owners and staff to work with the Cleaning system through supported apps, browser tools and communication channels. The list below shows the release state of each surface; a source project is not the same as an installable or published product.</p></div></section>
      <section className="px-6 pb-16"><div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-5">{surfaces.map(({ id, name, offer: offerId, detailsHref }) => { const offer = getAvailability(offerId); return <article id={id} key={id} className="bg-nx-surface border border-nx-border rounded-2xl p-7"><div className="flex flex-wrap items-center justify-between gap-3 mb-4"><h2 className="text-xl font-bold">{name}</h2><Status value={offer.label} /></div><p className="text-sm text-nx-muted leading-relaxed">{offer.explanation}</p>{detailsHref && <Link to={detailsHref} className="mt-5 inline-flex text-sm font-semibold text-nx-purple-light hover:text-white">View five planned product areas →</Link>}</article> })}</div></section>
      <section id="channels" className="px-6 pb-20"><div className="max-w-6xl mx-auto border-t border-nx-border pt-7"><SectionLabel>Business channels</SectionLabel><h2 className="text-2xl font-bold mb-3">For owners and the people doing the cleaning work.</h2><p className="text-sm text-nx-muted leading-relaxed max-w-3xl">The intended channel workflows cover owners running the business and staff coordinating work. Customer-facing communication is a separate workflow. WhatsApp, Telegram and Facebook Messenger are currently planned integrations; they are not live ways to operate a business in this review build.</p></div></section>
    </main>
  </>
}
