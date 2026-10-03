import { Link } from 'react-router-dom'
import PageMeta from '../components/PageMeta'
import SectionLabel from '../components/SectionLabel'
import { ButtonPrimary } from '../components/Button'
import { APP_SIGNUP_AVAILABLE, appRoutes } from '../config'

const tasks = [
  ['Answer calls and messages', 'Respond to common cleaning enquiries across connected phone, web chat, SMS, WhatsApp, Messenger and Telegram channels. Capture what the customer needs and keep the conversation together.'],
  ['Qualify the job', 'Collect the service type, property or site details, location, access requirements, preferred timing and recurring needs before handing work to booking or sales.'],
  ['Book from real availability', 'Offer configured service windows and create or change a booking through the Cleaning schedule, subject to your service area, capacity and approval rules.'],
  ['Recover missed enquiries', 'Create a callback task when a call is missed, route complex or urgent questions to a person and keep the owner or team informed.'],
  ['Follow up on overdue invoices', 'Use the current invoice and payment status to prepare or send an authorised reminder. The system does not invent a balance or mark a payment as received.'],
  ['Keep the handoff connected', 'Carry the conversation, customer, quote, booking, job or invoice context into the right team workflow, with delivery status and history.'],
]

const steps = [
  ['A customer reaches you', 'They call, message or submit an enquiry on a connected channel.'],
  ['Reception understands the request', 'It captures the cleaning need, property, location and timing details, then checks what information is missing.'],
  ['The next step is completed or routed', 'Reception can book within configured availability, request a human decision or send the conversation to the right person.'],
  ['Your team sees what happened', 'The enquiry and outcome stay connected to the customer and work record, with a follow-up task when needed.'],
]

export default function ReceptionSystem() {
  return <>
    <PageMeta title="AI Reception for Cleaning Businesses" description="AI Reception answers cleaning calls and messages, qualifies enquiries, books from configured availability, recovers missed calls and follows up on eligible overdue invoices." />
    <main>
      <section className="relative pt-32 pb-20 px-6 overflow-hidden">
        <div className="absolute -top-48 left-1/2 -translate-x-1/2 w-[760px] h-[760px] hero-glow pointer-events-none" />
        <div className="relative z-10 max-w-5xl mx-auto text-center">
          <SectionLabel>AI Reception for Cleaning</SectionLabel>
          <h1 className="text-4xl sm:text-6xl font-extrabold mb-5">Every enquiry gets a clear next step.</h1>
          <p className="text-lg text-nx-muted max-w-3xl mx-auto leading-relaxed">Answer customer calls and messages, capture the details of the clean, book from your real availability and recover missed enquiries—even while your team is out on a job.</p>
          <div className="mt-8 flex justify-center flex-wrap gap-5">
            <ButtonPrimary href={appRoutes.signup} disabled={!APP_SIGNUP_AVAILABLE}>Get started</ButtonPrimary>
            <Link to="/pricing#reception" className="inline-flex items-center text-sm font-semibold text-nx-purple-light hover:text-white">Reception pricing from A$99/month →</Link>
          </div>
        </div>
      </section>

      <section className="px-6 pb-20">
        <div className="max-w-6xl mx-auto">
          <div className="max-w-3xl mb-10">
            <SectionLabel>Reception and customer care</SectionLabel>
            <h2 className="text-3xl sm:text-4xl font-extrabold mb-4">More than picking up the phone.</h2>
            <p className="text-nx-muted leading-relaxed">Reception works with the cleaning customer, team and business records from first contact to a booked clean, a resolved issue or an authorised payment follow-up.</p>
          </div>
          <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
            {tasks.map(([title, description], index) => <article key={title} className="border border-nx-border rounded-2xl bg-nx-surface p-6"><p className="text-xs font-bold text-nx-purple-light mb-3">0{index + 1}</p><h3 className="text-lg font-bold mb-2">{title}</h3><p className="text-sm text-nx-muted leading-relaxed">{description}</p></article>)}
          </div>
        </div>
      </section>

      <section id="how-reception-works" className="px-6 py-20 border-y border-nx-border bg-nx-surface/30">
        <div className="max-w-6xl mx-auto">
          <SectionLabel>From conversation to completed work</SectionLabel>
          <h2 className="text-3xl sm:text-4xl font-extrabold mb-9">A useful handoff, every time.</h2>
          <ol className="grid md:grid-cols-2 xl:grid-cols-4 gap-5">
            {steps.map(([title, description], index) => <li key={title} className="border-t border-nx-border pt-5"><p className="text-xs font-bold text-nx-purple-light mb-3">{String(index + 1).padStart(2, '0')}</p><h3 className="font-bold mb-2">{title}</h3><p className="text-sm text-nx-muted leading-relaxed">{description}</p></li>)}
          </ol>
        </div>
      </section>

      <section className="px-6 py-20">
        <div className="max-w-6xl mx-auto grid lg:grid-cols-2 gap-8">
          <article className="border border-nx-border rounded-2xl bg-nx-surface p-7 sm:p-9">
            <SectionLabel>Inbound customer access</SectionLabel>
            <h2 className="text-2xl font-bold mb-4">Meet customers on the channel they use.</h2>
            <p className="text-sm text-nx-muted leading-relaxed">Connect phone calls, SMS, WhatsApp, Facebook Messenger, Telegram, website chat and email. Incoming enquiries, missed-call recovery and customer updates share the same conversation and service history.</p>
            <p className="mt-4 text-sm text-nx-muted leading-relaxed">Owners can review and guide reception. Staff can receive relevant work, send progress updates and hand conversations across the team through connected channels that are enabled for their company and role.</p>
            <Link to="/works-everywhere" className="mt-5 inline-flex text-sm font-semibold text-nx-purple-light">See every work surface →</Link>
          </article>
          <article className="border border-nx-border rounded-2xl bg-nx-surface p-7 sm:p-9">
            <SectionLabel>Bounded AI action</SectionLabel>
            <h2 className="text-2xl font-bold mb-4">Automate the routine. Escalate the exception.</h2>
            <p className="text-sm text-nx-muted leading-relaxed">Reception follows configured services, availability, communication preferences and authority rules. It hands off unusual pricing, sensitive customer issues, unclear payment status and other restricted decisions to an authorised person.</p>
            <p className="mt-4 text-sm text-nx-muted leading-relaxed">Call, message and provider usage is metered separately, with current rates visible before you enable a channel.</p>
            <Link to="/pricing#product-tiers" className="mt-5 inline-flex text-sm font-semibold text-nx-purple-light">Compare Assist, Plus and Pro →</Link>
          </article>
        </div>
      </section>

      <section className="px-6 pb-24">
        <div className="max-w-5xl mx-auto rounded-2xl border border-nx-border bg-nx-surface p-8 sm:p-10 text-center">
          <h2 className="text-2xl sm:text-3xl font-bold mb-4">Keep the customer conversation with the clean.</h2>
          <p className="text-sm text-nx-muted leading-relaxed mb-7">Titan Zero manages the AI workforce behind Cleaning. Reception connects to the same customer, schedule, job, finance and care workflows as the rest of your team.</p>
          <ButtonPrimary size="lg" href={appRoutes.signup} disabled={!APP_SIGNUP_AVAILABLE}>Start your Cleaning workspace</ButtonPrimary>
        </div>
      </section>
    </main>
  </>
}
