import { Check } from 'lucide-react'
import { ButtonPrimary, ButtonOutline } from '../components/Button'
import SectionLabel from '../components/SectionLabel'
import FadeIn from '../components/FadeIn'
import CTASection from '../components/CTASection'
import { appRoutes } from '../config'

const heroProofs = [
  'Managed around the systems you already use',
  'Titan Zero software fills genuine gaps',
  'Privacy-first and customer-controlled options',
  'Measured operational and resource outcomes',
]

const heroStats = [
  { num: 'Revenue', label: 'Create & recover' },
  { num: 'Cost', label: 'Reduce waste' },
  { num: 'Time', label: 'Return to the team' },
  { num: 'Cash', label: 'Accelerate collection' },
]

const trades = ['🧹 Cleaning', '🌿 Landscaping', '🏊 Pool Service', '💦 Pressure Washing', '🐛 Pest Control', '🪟 Window Cleaning', '🏠 Property Maintenance', '🚐 Mobile Services']

const integrations = [
  { name: 'Your CRM', icon: '👥' },
  { name: 'Your Calendar', icon: '📅' },
  { name: 'Your Phone', icon: '📞' },
  { name: 'Your Accounting', icon: '📗' },
  { name: 'Your Messaging', icon: '💬' },
  { name: 'Your Existing Apps', icon: '🔌' },
]

const features = [
  { icon: '📋', title: 'Quote Preparation', desc: 'Bring customer, property, job history and approved business knowledge together to prepare quotes for review and approval.', color: 'bg-purple-500/10' },
  { icon: '📅', title: 'Scheduling Support', desc: 'Coordinate recurring work, availability, skills, locations and exceptions while keeping your existing scheduling systems where they fit.', color: 'bg-cyan-500/10' },
  { icon: '🗺️', title: 'Field Coordination', desc: 'Keep jobs, locations, field teams, changes and customer communication connected across the operating day.', color: 'bg-green-500/10' },
  { icon: '💰', title: 'Billing Workflow', desc: 'Move authorised completed work toward invoicing and payment through the accounting and payment systems selected by the business.', color: 'bg-yellow-500/10' },
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
  { icon: '🔌', title: 'System Integration & Gap Filling', desc: 'Keep useful software, connect it through governed interfaces, and add Titan Zero software where a genuine operational gap remains.', color: 'bg-sky-500/10' },
]

const aiFeatures = [
  { icon: '\ud83e\udde0', title: 'Ghost Dispatching', desc: 'Auto-assigns the right technician to every job based on proximity and workload. Runs every 5 minutes \u2014 no dispatcher needed.' },
  { icon: '\u26a1', title: 'Vision Estimating', desc: 'Upload a job photo and get an AI-generated quote. Gemini Vision analyzes the image and drafts a priced line-item estimate.' },
  { icon: '\ud83d\udcc8', title: 'Virtual CFO Briefing', desc: 'A daily AI-generated financial summary lands in your inbox every morning: revenue, outstanding invoices, cash flow, and new leads.' },
  { icon: '\ud83d\udd04', title: 'Auto Follow-Up', desc: 'AI detects when quotes go cold and triggers personalized follow-up sequences. Invoice dunning runs automatically too.' },
]

const stats = [
  { num: '24/7', label: 'Workforce availability where configured' },
  { num: '1', label: 'Conversation-first operating surface' },
  { num: '5', label: 'Core operating stages connected' },
  { num: '0', label: 'Forced rip-and-replace migrations' },
]

const testimonials = []

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
            Managed Advanced Intelligence Workforce
          </div>

          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-black leading-[1.05] tracking-tight mb-6">
            Recover hidden value across your field-service business.<br />
            <span className="gradient-text">Then measure what changed.</span>
          </h1>

          <p className="text-lg text-nx-muted max-w-xl mx-auto mb-10 leading-relaxed">
            Titan Zero combines a managed Advanced Intelligence workforce, software gap filling, resource optimisation and measurement around the systems you already use. We track value across revenue, cost, time, cash and resources — without requiring the owner to become an AI expert.
          </p>

          <div className="flex justify-center gap-4 flex-wrap mb-8">
            <ButtonPrimary size="lg" href={appRoutes.signup}>Sign Up &rarr;</ButtonPrimary>
            <ButtonOutline size="lg" href={appRoutes.login}>Login</ButtonOutline>
          </div>

          <p className="text-xs text-nx-muted2 mb-8">Chat &middot; Voice &middot; Camera &middot; Existing-system integration</p>

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

      <section className="px-6 pb-24">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-10">
            <SectionLabel>Measured Value</SectionLabel>
            <h2 className="text-4xl sm:text-5xl font-extrabold tracking-tight">Five places Titan Zero looks for value.</h2>
            <p className="text-nx-muted text-lg max-w-3xl mx-auto mt-3">The discovery process establishes a baseline first. Titan Zero then measures actual customer results rather than presenting generic percentages as guaranteed outcomes.</p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-5 gap-4">
            {[
              ['Revenue created','Missed enquiries, lead response, quote follow-up, rebooking, reactivation, referrals and appropriate upsell opportunities.'],
              ['Cost saved','Software overlap, resource waste, avoidable rework, inefficient routing, inventory and infrastructure costs.'],
              ['Time recovered','Reception, scheduling, administration, document handling, support, sales administration and repetitive coordination.'],
              ['Cash accelerated','Invoice follow-up, payment workflow, quote recovery, retention and pricing/margin decision support.'],
              ['Resources & environment','Chemicals, water, energy, waste, procurement, environmental evidence and process improvement.'],
            ].map(([title,desc]) => (
              <div key={title} className="bg-nx-surface border border-nx-border rounded-2xl p-6">
                <h3 className="font-bold mb-2">{title}</h3><p className="text-xs text-nx-muted leading-relaxed">{desc}</p>
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
            Field Services industries
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
            One operating flow.<br />Less work falling between systems.
          </h2>
          <p className="text-nx-muted text-lg max-w-xl leading-relaxed">
            From the first enquiry through booking, field work, payment, follow-up and repeat service — Titan Zero helps connect the operational flow around your existing systems.
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
            <SectionLabel>Managed Workforce</SectionLabel>
            <h2 className="text-4xl sm:text-5xl font-extrabold tracking-tight mb-3 leading-tight">
              Your systems stay.<br />
              <span className="text-nx-purple-light">Titan Zero fills the gaps.</span>
            </h2>
            <p className="text-nx-muted text-lg max-w-lg leading-relaxed mb-8">
              Titan Zero is designed to coordinate specialised workforce capabilities across your business while keeping authority, governance, and review boundaries explicit.
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
            <h2 className="text-4xl font-extrabold tracking-tight">Built around real field-service operations</h2>
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
