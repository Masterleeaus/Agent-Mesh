import { Check } from 'lucide-react'
import { ButtonPrimary, ButtonOutline } from '../components/Button'
import SectionLabel from '../components/SectionLabel'
import FadeIn from '../components/FadeIn'
import CTASection from '../components/CTASection'
import { appRoutes } from '../config'

const heroProofs = [
  '75+ features included',
  'AI at every tier',
  'Set up in under 5 minutes',
  'No credit card required',
]

const heroStats = [
  { num: '75+', label: 'Features' },
  { num: '$0', label: 'Setup fee' },
  { num: '14 days', label: 'Free trial' },
  { num: '20+', label: 'AI Agents Built In' },
]

const trades = ['\u2744\ufe0f HVAC', '\ud83d\udd28 Handyman', '\u26a1 Electrical', '\ud83d\udebf Plumbing', '\ud83c\udf3f Landscaping', '\ud83e\uddf9 Cleaning', '\ud83c\udfd7\ufe0f Roofing', '\ud83c\udfa8 Painting']

const integrations = [
  { name: 'QuickBooks', icon: '📗' },
  { name: 'Stripe', icon: '💳' },
  { name: 'Google Calendar', icon: '📅' },
  { name: 'Twilio', icon: '📱' },
  { name: 'Zapier', icon: '⚡' },
  { name: 'Gmail', icon: '📧' },
]

const features = [
  { icon: '\ud83d\udccb', title: 'Smart Quoting', desc: 'Create professional quotes in seconds. AI suggests pricing based on job type, materials, and your history. Clients approve with one tap.', color: 'bg-purple-500/10' },
  { icon: '\ud83d\udcc5', title: 'AI Scheduling', desc: 'Drag-and-drop calendar with AI-powered auto-assignment. Matches technicians by skill, location, and availability. No more double-bookings.', color: 'bg-cyan-500/10' },
  { icon: '\ud83d\uddfa\ufe0f', title: 'Route Optimization', desc: 'Real turn-by-turn routing with multi-stop optimization. Traffic-aware ETAs. Your crew saves hours and fuel every week.', color: 'bg-green-500/10' },
  { icon: '\ud83d\udcb0', title: 'Invoicing & Payments', desc: 'Progress invoicing, batch invoicing, deposit tracking, and Tap to Pay. Accept cards, ACH, Apple Pay, Google Pay via Stripe \u2014 with 0% platform markup, so every dollar the customer pays lands in your account.', color: 'bg-yellow-500/10' },
  { icon: '\ud83d\udc65', title: 'Client CRM', desc: 'Full client profiles with service history, lifetime value, communication log, and satisfaction scores. Know every customer like your best one.', color: 'bg-red-500/10' },
  { icon: '\ud83d\udcf1', title: 'Offline Mode + Sync', desc: "Your crew works everywhere \u2014 even without signal. IndexedDB caching, mutation queue, and automatic background sync when connectivity returns.", color: 'bg-orange-500/10' },
  { icon: '\ud83d\udcac', title: 'Two-Way SMS', desc: 'Text clients and crew from one dashboard. Automated appointment reminders, on-my-way alerts, and follow-ups \u2014 included in every plan.', color: 'bg-blue-500/10' },
  { icon: '\ud83d\udcca', title: 'Real Analytics', desc: "Not basic pie charts. Custom dashboards, revenue trends, technician scorecards, job profitability \u2014 the insights your business actually needs.", color: 'bg-violet-500/10' },
  { icon: '\ud83c\udf10', title: 'Client Portal', desc: 'A branded self-serve portal where your customers approve quotes, track their technician in real-time, pay invoices, and book services 24/7.', color: 'bg-teal-500/10' },
  { icon: '\ud83d\udcc6', title: 'Calendar Sync', desc: 'Two-way sync with Google Calendar and Microsoft 365. Schedule or update a job and the calendar event updates automatically.', color: 'bg-indigo-500/10' },
  { icon: '\ud83d\udce8', title: 'Email Campaigns', desc: 'Send targeted SMS and email campaigns to your customer base. Built-in templates, batch messaging, and delivery tracking.', color: 'bg-pink-500/10' },
  { icon: '\ud83d\udd04', title: 'Recurring Jobs & Invoices', desc: 'Set up maintenance contracts and recurring services. Invoices generate and send automatically on schedule.', color: 'bg-emerald-500/10' },
  { icon: '\ud83d\udccd', title: 'Geofencing', desc: 'Auto clock-in when techs arrive on site. Monitor arrivals, departures, and violations. Per-job radius controls with manager alerts.', color: 'bg-rose-500/10' },
  { icon: '\ud83c\udfa4', title: 'Voice-to-Invoice', desc: 'Techs record a voice note after a job. AI transcribes it and extracts line items into a ready-to-send invoice draft.', color: 'bg-amber-500/10' },
  { icon: '\ud83d\udce5', title: 'Competitor Import', desc: 'Migrating from Jobber or HousecallPro? Import your customers, jobs, and history automatically with platform auto-detection.', color: 'bg-sky-500/10' },
]

const aiFeatures = [
  { icon: '\ud83e\udde0', title: 'Ghost Dispatching', desc: 'Auto-assigns the right technician to every job based on proximity and workload. Runs every 5 minutes \u2014 no dispatcher needed.' },
  { icon: '\u26a1', title: 'Vision Estimating', desc: 'Upload a job photo and get an AI-generated quote. Gemini Vision analyzes the image and drafts a priced line-item estimate.' },
  { icon: '\ud83d\udcc8', title: 'Virtual CFO Briefing', desc: 'A daily AI-generated financial summary lands in your inbox every morning: revenue, outstanding invoices, cash flow, and new leads.' },
  { icon: '\ud83d\udd04', title: 'Auto Follow-Up', desc: 'AI detects when quotes go cold and triggers personalized follow-up sequences. Invoice dunning runs automatically too.' },
]

const stats = [
  { num: '3.2hrs', label: 'Average time saved per day' },
  { num: '47%', label: 'Faster estimate-to-close' },
  { num: '$15k', label: 'Avg annual fuel savings' },
  { num: '99.9%', label: 'Uptime guarantee' },
]

const testimonials = [
  {
    text: '"Before NexJob, I was running my HVAC business off a clipboard and three group chats. Now my techs get dispatched automatically, customers pay from a text before I even get back to the truck, and I actually know which jobs are making me money."',
    initials: 'T', name: 'Todd', role: 'Owner, TLT HVAC \u00b7 Ohio',
  },
  {
    text: '"We switched from Jobber to NexJob and saved over two grand a year \u2014 but honestly the AI is what sold me. I can take a photo of a roof, get a quote drafted in seconds, and send it to the homeowner before I\'m off the ladder."',
    initials: 'N', name: 'Nick', role: 'Owner, CRCS Roofing \u00b7 Florida',
  },
  {
    text: '"I\'m a one-man shop and NexJob makes me look like I have an office staff. The AI answers my texts after hours, books jobs onto my calendar, and sends invoices with a pay link the second I mark the job done."',
    initials: 'D', name: 'Dan', role: 'Owner, Pipe Dreams Plumbing \u00b7 Kentucky',
  },
]

export default function Home() {
  return (
    <>
      {/* ===== HERO ===== */}
      <section className="relative pt-40 pb-24 overflow-hidden">
        {/* Glows */}
        <div className="absolute -top-48 left-1/2 -translate-x-1/2 w-[800px] h-[800px] hero-glow pointer-events-none" />
        <div className="absolute top-0 right-[-100px] w-[400px] h-[400px] hero-glow-cyan pointer-events-none" />

        <div className="relative z-10 max-w-7xl mx-auto px-6 text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 text-xs font-semibold text-nx-purple-light bg-purple-500/10 border border-purple-500/20 px-4 py-1.5 rounded-full mb-6">
            <span className="w-1.5 h-1.5 bg-nx-green rounded-full animate-pulse-dot" />
            20+ AI Agents Included at Every Tier
          </div>

          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-black leading-[1.05] tracking-tight mb-6">
            Run Your Entire<br />
            Field Service on <span className="gradient-text">Autopilot</span>
          </h1>

          <p className="text-lg text-nx-muted max-w-xl mx-auto mb-10 leading-relaxed">
            AI-powered scheduling, dispatching, invoicing, and client management &mdash; built for trade pros who want to grow without the growing pains. Starting at $29/mo.
          </p>

          <div className="flex justify-center gap-4 flex-wrap mb-8">
            <ButtonPrimary size="lg" href={appRoutes.signup}>Start Free &mdash; 14 Days &rarr;</ButtonPrimary>
            <ButtonOutline size="lg" href="https://cal.com/steve-guilkey-9ooniv/15min">Book a Demo</ButtonOutline>
          </div>

          <p className="text-xs text-nx-muted2 mb-8">No credit card &middot; All features unlocked &middot; Cancel anytime</p>

          {/* Inline Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 max-w-xl mx-auto mb-8">
            {heroStats.map((s) => (
              <div key={s.label} className="text-center">
                <div className="text-2xl font-extrabold tracking-tight gradient-text-static">{s.num}</div>
                <div className="text-xs text-nx-muted mt-0.5">{s.label}</div>
              </div>
            ))}
          </div>

          <div className="flex justify-center flex-wrap gap-x-6 gap-y-2">
            {heroProofs.map((proof) => (
              <div key={proof} className="flex items-center gap-1.5 text-sm text-nx-muted">
                <Check size={16} className="text-nx-green" />
                {proof}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== INTEGRATION BAR ===== */}
      <section className="border-y border-nx-border py-10">
        <div className="max-w-7xl mx-auto px-6">
          <p className="text-center text-xs font-medium text-nx-muted2 uppercase tracking-widest mb-5">
            Works with your existing tools
          </p>
          <div className="flex justify-center items-center flex-wrap gap-8">
            {integrations.map((i) => (
              <div key={i.name} className="flex items-center gap-2 text-sm font-semibold text-nx-muted">
                <span className="text-lg">{i.icon}</span>
                {i.name}
              </div>
            ))}
          </div>
          <p className="text-center text-xs font-medium text-nx-muted2 uppercase tracking-widest mt-8 mb-4">
            Built for every trade
          </p>
          <div className="flex justify-center items-center flex-wrap gap-8 opacity-50">
            {trades.map((t) => (
              <span key={t} className="text-sm font-bold text-nx-muted tracking-wide">{t}</span>
            ))}
          </div>
        </div>
      </section>

      {/* ===== FEATURES GRID ===== */}
      <section className="py-24 px-6">
        <div className="max-w-7xl mx-auto">
          <SectionLabel>Features</SectionLabel>
          <h2 className="text-4xl sm:text-5xl font-extrabold tracking-tight mb-3 leading-tight">
            Everything to run your<br />service business
          </h2>
          <p className="text-nx-muted text-lg max-w-xl leading-relaxed">
            From the first quote to the final invoice \u2014 and every job, route, and payment in between.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-px bg-nx-border border border-nx-border rounded-2xl overflow-hidden mt-12">
            {features.map((f, i) => (
              <FadeIn key={f.title} delay={i * 50}>
                <div className="bg-nx-surface p-8 hover:bg-nx-surface2 transition-colors cursor-default h-full">
                  <div className={`w-11 h-11 rounded-xl flex items-center justify-center text-xl mb-4 ${f.color}`}>
                    {f.icon}
                  </div>
                  <h3 className="text-base font-bold mb-2">{f.title}</h3>
                  <p className="text-sm text-nx-muted leading-relaxed">{f.desc}</p>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* ===== AI SECTION ===== */}
      <section className="relative py-24 px-6">
        <div className="absolute inset-0 bg-gradient-to-b from-nx-bg via-purple-500/[0.03] to-nx-bg pointer-events-none" />
        <div className="relative z-10 max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          {/* Left: Content */}
          <div>
            <SectionLabel>AI Engine</SectionLabel>
            <h2 className="text-4xl sm:text-5xl font-extrabold tracking-tight mb-3 leading-tight">
              Your business runs itself.<br />
              <span className="text-nx-purple-light">AI handles the rest.</span>
            </h2>
            <p className="text-nx-muted text-lg max-w-lg leading-relaxed mb-8">
              NexJob's AI engine doesn't just make suggestions \u2014 it takes action. Smart dispatching, predictive scheduling, and automated follow-ups that work 24/7.
            </p>
            <div className="space-y-4">
              {aiFeatures.map((f) => (
                <div key={f.title} className="flex gap-3">
                  <div className="flex-shrink-0 w-9 h-9 rounded-lg flex items-center justify-center text-sm bg-nx-purple-glow">
                    {f.icon}
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold mb-0.5">{f.title}</h4>
                    <p className="text-xs text-nx-muted leading-relaxed">{f.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right: Terminal */}
          <div className="bg-nx-surface border border-nx-border rounded-2xl p-6">
            <div className="bg-nx-bg rounded-xl p-5 font-mono text-sm leading-loose">
              <p className="text-nx-muted2">{'// NexJob AI \u2014 Live dispatch optimization'}</p>
              <p className="mt-2"><span className="text-nx-purple-light">nexjob&gt;</span> <span className="text-nx-cyan-light">optimize_schedule</span>(date: &quot;today&quot;)</p>
              <p className="text-nx-green-light mt-2">\u2713 Analyzing 12 jobs across 4 technicians...</p>
              <p className="text-nx-green-light">\u2713 Rerouted Mike: saved 47 min drive time</p>
              <p className="text-nx-green-light">\u2713 Swapped Job #1847 \u2192 Sarah (closer + certified)</p>
              <p className="text-nx-green-light">\u2713 Flagged: Client Martinez hasn't viewed estimate</p>
              <p className="text-nx-green-light">&nbsp; \u2192 Auto-SMS follow-up scheduled for 2:00 PM</p>
              <p className="mt-3"><span className="text-nx-purple-light">nexjob&gt;</span> <span className="text-nx-cyan-light">revenue_query</span>(&quot;best month this quarter&quot;)</p>
              <p className="text-nx-green-light mt-2">\u2713 February: $48,720 (+22% vs Jan)</p>
              <p className="text-nx-green-light">&nbsp; Top service: HVAC maintenance ($18,400)</p>
              <p className="text-nx-green-light">&nbsp; Top closer: Sarah K. (94% win rate)</p>
              <p className="text-nx-muted2 mt-3">\u2588 Ready for next command...</p>
            </div>
          </div>
        </div>
      </section>

      {/* ===== STATS ===== */}
      <section className="border-y border-nx-border py-16 px-6">
        <div className="max-w-7xl mx-auto grid grid-cols-2 lg:grid-cols-4 gap-8 text-center">
          {stats.map((s) => (
            <div key={s.label}>
              <div className="text-4xl font-extrabold tracking-tight gradient-text-static">{s.num}</div>
              <div className="text-sm text-nx-muted mt-1">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ===== TESTIMONIALS ===== */}
      <section className="py-24 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center">
            <SectionLabel>Testimonials</SectionLabel>
            <h2 className="text-4xl font-extrabold tracking-tight">Service pros love NexJob</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mt-12">
            {testimonials.map((t) => (
              <FadeIn key={t.name}>
                <div className="bg-nx-surface border border-nx-border rounded-2xl p-7 hover:border-nx-purple transition-colors h-full flex flex-col">
                  <p className="text-yellow-400 text-sm tracking-widest mb-4">\u2605\u2605\u2605\u2605\u2605</p>
                  <p className="text-sm text-nx-text2 leading-relaxed flex-1 mb-5">{t.text}</p>
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-nx-surface3 flex items-center justify-center text-xs font-bold text-nx-purple-light">
                      {t.initials}
                    </div>
                    <div>
                      <div className="text-sm font-semibold">{t.name}</div>
                      <div className="text-xs text-nx-muted2">{t.role}</div>
                    </div>
                  </div>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* ===== CTA ===== */}
      <CTASection />
    </>
  )
}
