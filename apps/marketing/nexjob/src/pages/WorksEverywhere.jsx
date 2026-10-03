import { Link } from 'react-router-dom'
import PageMeta from '../components/PageMeta'
import SectionLabel from '../components/SectionLabel'
import { ButtonPrimary } from '../components/Button'
import { APP_SIGNUP_AVAILABLE, appRoutes } from '../config'

const surfaces = [
  { id: 'mobile-app', name: 'Owner and cleaner mobile apps', audience: 'Titan Command for owners · Titan Go for cleaners', description: 'Owners and managers review the business from Titan Command. Cleaners use Titan Go on the job to see assigned visits, site instructions and checklists, capture photos and notes, and report progress. See mobile upgrade pricing.', href: '/pricing#cleaner-mobile', cta: 'See mobile app pricing' },
  { id: 'pwa', name: 'Progressive web app', audience: 'Office and field teams', description: 'Open the Cleaning workspace in a browser and install it as a PWA on supported devices for a quick, app-like way to access the same business workflow.' },
  { id: 'chrome', name: 'Five Chrome extensions', audience: 'People doing browser-based business work', description: 'Install separate extensions for Bookings, Invoicing, Job Management, Quotes and CRM. Each uses approved page context to prepare work for the connected business.' , href: '/chrome-extensions', cta: 'Explore five Chrome extensions' },
  { id: 'wordpress', name: 'Five WordPress plugins', audience: 'Cleaning businesses with a WordPress site', description: 'Install separate plugins for Bookings, Invoicing, Job Management, Quotes and CRM. Use WordPress forms and records locally, or connect them to the Cleaning system.', href: '/wordpress-plugins', cta: 'Explore five WordPress plugins' },
  { id: 'chatgpt', name: 'ChatGPT', audience: 'Owners, managers and staff', description: 'Ask about approved cleaning business context, prepare replies and quotes, and request next steps through a connected ChatGPT experience.' },
  { id: 'whatsapp', name: 'WhatsApp', audience: 'Customers, owners and staff', description: 'Receive customer enquiries and service updates, coordinate approved tasks and keep work conversations connected to the right business record.' },
  { id: 'telegram', name: 'Telegram', audience: 'Owners and staff', description: 'Use a team-friendly channel for job coordination, status updates, questions and follow-up with the right company context.' },
  { id: 'messenger', name: 'Facebook Messenger', audience: 'Customers, owners and staff', description: 'Respond to social enquiries, continue customer conversations and route requests into the same cleaning workflow.', href: '/marketing', cta: 'See the marketing system' },
  { id: 'sms', name: 'SMS', audience: 'Customers, owners and staff', description: 'Send approved booking reminders and service updates; give staff a connected way to receive work and report progress.', href: '/marketing', cta: 'See the marketing system' },
  { id: 'phone', name: 'Phone calls', audience: 'Customers, owners and staff', description: 'AI Reception can answer customer calls, capture cleaning details, book from configured availability and route complex requests to your team.', href: '/reception', cta: 'See AI Reception' },
]

const workExamples = [
  ['Owners and managers', 'Review enquiries, work queues, quotes, schedule changes, exceptions, approvals, invoices and business follow-up.'],
  ['Cleaning staff', 'Receive assigned visits, read property and access notes, ask questions, update job progress, complete checklists and send evidence.'],
  ['Customers', 'Ask questions, request a clean, confirm or change a booking, receive updates, review a quote and follow up on service.'],
]

export default function WorksEverywhere() {
  return <>
    <PageMeta title="Works Everywhere for Cleaning Teams" description="Use the Cleaning workforce and business system through owner and cleaner mobile apps, the PWA, five Chrome extensions, five WordPress plugins, ChatGPT, SMS, phone, WhatsApp, Telegram and Facebook Messenger." />
    <main>
      <section className="pt-32 pb-16 px-6 text-center">
        <div className="max-w-5xl mx-auto">
          <SectionLabel>Works Everywhere</SectionLabel>
          <h1 className="text-4xl sm:text-6xl font-extrabold mb-5">The same cleaning work, wherever your team is.</h1>
          <p className="text-lg text-nx-muted max-w-3xl mx-auto leading-relaxed">Owners, cleaners and customers can reach the Cleaning system through the apps and channels they already use. The interface changes for the task; customer records, jobs, approvals and evidence stay connected.</p>
          <div className="mt-7"><ButtonPrimary href={appRoutes.signup} disabled={!APP_SIGNUP_AVAILABLE}>Sign up for Cleaning</ButtonPrimary></div>
        </div>
      </section>

      <section className="px-6 pb-20">
        <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-5">{surfaces.map(({ id, name, audience, description, href, cta }) => <article id={id} key={id} className="bg-nx-surface border border-nx-border rounded-2xl p-7"><p className="text-xs uppercase tracking-wide font-bold text-nx-purple-light mb-3">{audience}</p><h2 className="text-2xl font-bold mb-3">{name}</h2><p className="text-sm text-nx-muted leading-relaxed">{description}</p>{href && <Link to={href} className="mt-5 inline-flex text-sm font-semibold text-nx-purple-light hover:text-white">{cta} →</Link>}</article>)}</div>
      </section>

      <section id="channels" className="px-6 py-20 border-y border-nx-border bg-nx-surface/30">
        <div className="max-w-6xl mx-auto">
          <SectionLabel>Owners, staff and customers</SectionLabel>
          <h2 className="text-3xl sm:text-4xl font-extrabold mb-5">Each person can handle the work for their role.</h2>
          <p className="text-nx-muted leading-relaxed max-w-4xl mb-9">Messaging channels are more than an inbox. Owners can review the operation and approve decisions; staff can receive assignments and report work; customers can ask for service and get updates. Every action follows company scope, channel consent, role permissions and the approval rules for that action.</p>
          <div className="grid md:grid-cols-3 gap-4">{workExamples.map(([title, description]) => <article key={title} className="border-t border-nx-border pt-5"><h3 className="font-bold mb-2">{title}</h3><p className="text-sm text-nx-muted leading-relaxed">{description}</p></article>)}</div>
        </div>
      </section>

      <section className="px-6 py-20">
        <div className="max-w-6xl mx-auto flex flex-wrap items-center justify-between gap-6 border-t border-nx-border pt-7">
          <div><SectionLabel>Choose your tools</SectionLabel><h2 className="text-2xl font-bold">Five plugins. Five extensions. One Cleaning workflow.</h2></div>
          <div className="flex flex-wrap gap-5"><Link to="/wordpress-plugins" className="text-sm font-semibold text-nx-purple-light">WordPress plugins →</Link><Link to="/chrome-extensions" className="text-sm font-semibold text-nx-purple-light">Chrome extensions →</Link><Link to="/ai-workforce" className="text-sm font-semibold text-nx-purple-light">AI workforce →</Link></div>
        </div>
      </section>
    </main>
  </>
}
