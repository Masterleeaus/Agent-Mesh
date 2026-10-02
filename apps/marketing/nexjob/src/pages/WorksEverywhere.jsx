import PageMeta from '../components/PageMeta'
import SectionLabel from '../components/SectionLabel'
import { getAvailability } from '../data/verticalCatalogue'

const surfaces = [
  { id: 'mobile-app', name: 'Mobile app', offer: 'nativeMobile' },
  { id: 'pwa', name: 'Titan Zero PWA', offer: 'pwa' },
  { id: 'chrome', name: 'Per-vertical Chrome extension', offer: 'chromeVerticalExtension' },
  { id: 'wordpress', name: 'Per-vertical WordPress plugins', offer: 'wordpressVerticalPlugin' },
  { id: 'chatgpt', name: 'ChatGPT', offer: 'chatGptApp' },
  { id: 'whatsapp', name: 'WhatsApp', offer: 'whatsappWorkChannel' },
  { id: 'telegram', name: 'Telegram', offer: 'telegramWorkChannel' },
  { id: 'messenger', name: 'Facebook Messenger', offer: 'facebookMessengerWorkChannel' },
]

function Status({ value }) {
  return <span className="inline-flex rounded-full border border-nx-purple/30 bg-nx-purple/10 px-3 py-1 text-xs font-semibold text-nx-purple-light">{value}</span>
}

export default function WorksEverywhere() {
  return <>
    <PageMeta title="Works Everywhere" description="See the current release state of Titan Zero mobile, PWA, browser, WordPress, ChatGPT and messaging work surfaces." />
    <main>
      <section className="pt-32 pb-14 px-6 text-center"><div className="max-w-5xl mx-auto"><SectionLabel>Works Everywhere</SectionLabel><h1 className="text-4xl sm:text-6xl font-extrabold mb-5">Work surfaces, with their release state shown.</h1><p className="text-lg text-nx-muted max-w-3xl mx-auto">Titan Zero is designed to connect work across web, mobile, browser extensions, plugins and communication channels. Statuses below reflect source and release evidence; no store installation, production deployment or live connection is implied.</p></div></section>
      <section className="px-6 pb-16"><div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-5">{surfaces.map(({ id, name, offer: offerId }) => { const offer = getAvailability(offerId); return <article id={id} key={id} className="bg-nx-surface border border-nx-border rounded-2xl p-7"><div className="flex flex-wrap items-center justify-between gap-3 mb-4"><h2 className="text-xl font-bold">{name}</h2><Status value={offer.label} /></div><p className="text-sm text-nx-muted leading-relaxed">{offer.explanation}</p></article> })}</div></section>
      <section id="channels" className="px-6 pb-20"><div className="max-w-6xl mx-auto rounded-2xl border border-nx-border bg-nx-surface p-8"><SectionLabel>Work and communication channels</SectionLabel><h2 className="text-2xl font-bold mb-3">Designed around the person doing the work.</h2><p className="text-sm text-nx-muted leading-relaxed">Channel workflows are intended to support authorised owner, staff and customer work where appropriate. Role coverage and channel release remain subject to implementation and verification; no unsupported channel is presented as live.</p></div></section>
    </main>
  </>
}
