import { Link } from 'react-router-dom'
import PageMeta from '../components/PageMeta'
import SectionLabel from '../components/SectionLabel'
import { ButtonPrimary } from '../components/Button'
import { APP_SIGNUP_AVAILABLE, appRoutes } from '../config'

const channels = [
  ['SMS', 'Send booking reminders, service updates and permission-based follow-ups.'],
  ['WhatsApp', 'Continue customer conversations and send approved messages through a connected business account.'],
  ['Facebook Messenger', 'Respond to social enquiries and route them into the right cleaning workflow.'],
  ['Telegram', 'Give owners and staff a connected channel for work questions, assignments and updates.'],
  ['Phone calls', 'Make eligible customer follow-up calls and connect inbound response through AI Reception.'],
  ['Web chat & email', 'Capture website questions, service requests and customer messages in the same work history.'],
]

const campaigns = [
  ['Bring regular customers back', 'Schedule approved reminders around recurring cleans, seasonal services or a customer’s last completed visit.'],
  ['Follow up an open quote', 'Find an approved quote that needs attention, draft a useful follow-up and track the response through to a decision.'],
  ['Fill upcoming capacity', 'Match eligible outreach to open schedule capacity and service areas, then measure the resulting enquiries and bookings.'],
  ['Build local reputation', 'Prepare review and referral requests for customers with an eligible service outcome and the right channel permissions.'],
]

export default function MarketingSystem() {
  return <>
    <PageMeta title="Omnichannel Marketing for Cleaning Businesses" description="Plan permission-based cleaning campaigns across SMS, WhatsApp, Facebook Messenger, Telegram and phone calls, with lead generation, booking and revenue outcomes connected." />
    <main>
      <section className="relative pt-32 pb-20 px-6 overflow-hidden">
        <div className="absolute -top-48 left-1/2 -translate-x-1/2 w-[760px] h-[760px] hero-glow pointer-events-none" />
        <div className="relative z-10 max-w-5xl mx-auto text-center">
          <SectionLabel>Cleaning marketing system</SectionLabel>
          <h1 className="text-4xl sm:text-6xl font-extrabold mb-5">Turn customer conversations into repeat work.</h1>
          <p className="text-lg text-nx-muted max-w-3xl mx-auto leading-relaxed">Plan a campaign, reach customers on the channels they already use and connect each response to quotes, bookings and completed cleaning work.</p>
          <div className="mt-8 flex justify-center flex-wrap gap-5">
            <ButtonPrimary href={appRoutes.signup} disabled={!APP_SIGNUP_AVAILABLE}>Get started</ButtonPrimary>
            <Link to="/pricing#marketing-system" className="inline-flex items-center text-sm font-semibold text-nx-purple-light hover:text-white">Marketing from A$79/month →</Link>
          </div>
        </div>
      </section>

      <section className="px-6 pb-20">
        <div className="max-w-6xl mx-auto">
          <div className="max-w-3xl mb-10">
            <SectionLabel>Customer channels</SectionLabel>
            <h2 className="text-3xl sm:text-4xl font-extrabold mb-4">One connected marketing workflow across channels.</h2>
            <p className="text-nx-muted leading-relaxed">SMS, WhatsApp, Messenger, Telegram and phone calls work alongside website chat and email where configured. Conversations, delivery status and customer responses stay connected to the right business record.</p>
          </div>
          <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
            {channels.map(([name, description], index) => <article key={name} className="border border-nx-border rounded-2xl bg-nx-surface p-6"><p className="text-xs font-bold text-nx-purple-light mb-3">CHANNEL 0{index + 1}</p><h3 className="text-lg font-bold mb-2">{name}</h3><p className="text-sm text-nx-muted leading-relaxed">{description}</p></article>)}
          </div>
        </div>
      </section>

      <section className="px-6 py-20 border-y border-nx-border bg-nx-surface/30">
        <div className="max-w-6xl mx-auto">
          <SectionLabel>Useful campaigns</SectionLabel>
          <h2 className="text-3xl sm:text-4xl font-extrabold mb-9">Put your next customer-growth play on a real workflow.</h2>
          <div className="grid md:grid-cols-2 gap-4">
            {campaigns.map(([title, description], index) => <article key={title} className="border border-nx-border rounded-2xl p-6"><p className="text-xs font-bold text-nx-purple-light mb-3">0{index + 1}</p><h3 className="text-lg font-bold mb-2">{title}</h3><p className="text-sm text-nx-muted leading-relaxed">{description}</p></article>)}
          </div>
        </div>
      </section>

      <section className="px-6 py-20">
        <div className="max-w-6xl mx-auto grid lg:grid-cols-2 gap-8">
          <article className="border border-nx-border rounded-2xl bg-nx-surface p-7 sm:p-9">
            <SectionLabel>AI helps run the workflow</SectionLabel>
            <h2 className="text-2xl font-bold mb-4">From draft to measured result.</h2>
            <p className="text-sm text-nx-muted leading-relaxed">AI can suggest a campaign, prepare copy and audience segments, monitor replies and report which enquiries became quotes or bookings. Plus keeps campaigns and follow-ups moving through approval gates; Pro can execute the tasks your business has explicitly authorised and forecast capacity or response trends.</p>
          </article>
          <article className="border border-nx-border rounded-2xl bg-nx-surface p-7 sm:p-9">
            <SectionLabel>Controls built into the flow</SectionLabel>
            <h2 className="text-2xl font-bold mb-4">Reach the right people, with the right permission.</h2>
            <p className="text-sm text-nx-muted leading-relaxed">Use company customer lists and reviewed prospects. Keep contact preferences, consent evidence, opt-outs, quiet hours, campaign budgets and available cleaning capacity in view. A Maps discovery or imported phone number is not itself permission to contact someone.</p>
            <p className="mt-4 text-sm text-nx-muted leading-relaxed">Phone, SMS, WhatsApp and other provider usage is billed separately at the displayed channel rate.</p>
          </article>
        </div>
        <div className="max-w-6xl mx-auto mt-8 flex flex-wrap gap-5">
          <Link to="/reception" className="text-sm font-semibold text-nx-purple-light">AI Reception →</Link>
          <Link to="/lead-generation" className="text-sm font-semibold text-nx-purple-light">Find new cleaning prospects →</Link>
        </div>
      </section>
    </main>
  </>
}
