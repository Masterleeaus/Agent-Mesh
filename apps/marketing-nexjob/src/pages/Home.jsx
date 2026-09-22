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
  { num: '5–10%', label: 'Estimated revenue opportunity' },
  { num: '3–5%', label: 'Estimated cost opportunity' },
  { num: '4–6%', label: 'Estimated time-value opportunity' },
  { num: '2–4%', label: 'Estimated cash-flow opportunity' },
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
  { icon: '📞', title: 'Reception & Lead Handling', desc: 'Capture enquiries, qualify leads, prepare next actions and keep authorised follow-up moving across configured channels.', color: 'bg-blue-900/10' },
  { icon: '📋', title: 'Quote Preparation', desc: 'Bring customer, property, job history and approved business knowledge together to prepare quotes for review and approval.', color: 'bg-slate-600/10' },
  { icon: '📅', title: 'Scheduling Support', desc: 'Coordinate recurring work, availability, skills, locations and exceptions while keeping existing scheduling systems where they fit.', color: 'bg-green-500/10' },
  { icon: '🗺️', title: 'Field Coordination', desc: 'Keep jobs, locations, field teams, changes and customer communication connected across the operating day.', color: 'bg-yellow-500/10' },
  { icon: '💬', title: 'Customer Care', desc: 'Support reminders, updates, feedback, service recovery, rebooking and retention workflows using authorised customer context.', color: 'bg-red-500/10' },
  { icon: '💰', title: 'Billing & Collections Workflow', desc: 'Move authorised completed work toward invoicing, follow-up and payment through the accounting and payment systems selected by the business.', color: 'bg-orange-500/10' },
  { icon: '📄', title: 'Document Intelligence', desc: 'Connect receipts, quotes, job records, compliance evidence and other authorised documents to the relevant business workflow.', color: 'bg-blue-500/10' },
  { icon: '📊', title: 'Value Measurement', desc: 'Establish baselines and report measured changes across revenue, cost, time, cash and resources instead of relying on generic ROI claims.', color: 'bg-slate-700/10' },
  { icon: '🧠', title: 'Private Business Knowledge', desc: 'Use governed company knowledge and private retrieval options so workforce capabilities operate with relevant business context.', color: 'bg-teal-500/10' },
  { icon: '📦', title: 'Inventory & Procurement', desc: 'Connect stock, consumables, purchasing, suppliers and resource-use context to operational decisions where configured.', color: 'bg-indigo-500/10' },
  { icon: '🌱', title: 'Environmental Intelligence', desc: 'Measure chemical, water, energy, waste and procurement opportunities and connect improvements to operating evidence.', color: 'bg-emerald-500/10' },
  { icon: '🔌', title: 'System Integration & Gap Filling', desc: 'Keep useful software, connect it through governed interfaces, and add Titan Zero software where a genuine operational gap remains.', color: 'bg-sky-500/10' },
]

const aiFeatures = [
  { icon: '📞', title: 'Customer & Reception Workforce', desc: 'Supports enquiries, qualification, booking, reminders and follow-up within configured authority.' },
  { icon: '⚙️', title: 'Operations Workforce', desc: 'Supports scheduling, field coordination, exceptions and operational next actions across connected systems.' },
  { icon: '📈', title: 'Business Intelligence Workforce', desc: 'Surfaces baselines, exceptions, opportunities and decision support from authorised business information.' },
  { icon: '🔄', title: 'Follow-Up Workforce', desc: 'Keeps authorised quote, invoice, customer-care and rebooking workflows moving instead of letting work disappear between systems.' },
]



const stats = [
  { num: '24/7', label: 'Workforce availability where configured' },
  { num: '1', label: 'Conversation-first operating surface' },
  { num: '5', label: 'Core operating stages connected' },
  { num: '0', label: 'Forced rip-and-replace migrations' },
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
          <div className="inline-flex items-center gap-2 text-xs font-semibold text-nx-purple-light bg-blue-900/10 border border-blue-900/20 px-4 py-1.5 rounded-full mb-6">
            <span className="w-1.5 h-1.5 bg-nx-green rounded-full animate-pulse-dot" />
            Your business. Your Zero. Your team.
          </div>

          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-black leading-[1.05] tracking-tight mb-6">
            Your business. Your Zero.<br />
            <span className="gradient-text">Your team.</span>
          </h1>

          <p className="text-lg text-nx-muted max-w-xl mx-auto mb-10 leading-relaxed">
            Titan Zero gives you a digital working intelligence that learns your business, works alongside you and coordinates an AI workforce to help run it. We connect it to the systems you already use, fill genuine gaps and manage the intelligence system for you.
          </p>

          <div className="flex justify-center gap-4 flex-wrap mb-8">
            <ButtonPrimary size="lg" href={appRoutes.signup}>Sign Up &rarr;</ButtonPrimary>
            <ButtonOutline size="lg" href={appRoutes.login}>Login</ButtonOutline>
          </div>

          <p className="text-xs text-nx-muted2 mb-4">Not another chatbot. Not another dashboard. Not another piece of software your team has to learn.</p>
          <p className="text-sm font-semibold mb-8">You don't need to become an AI expert. You just need to run your business.</p>

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
        <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-12 items-center bg-nx-surface border border-nx-border rounded-3xl p-8 sm:p-12">
          <div><SectionLabel>Meet Your Zero</SectionLabel><h2 className="text-4xl sm:text-5xl font-extrabold mb-5">One + Zero + Team.</h2><p className="text-lg text-nx-muted leading-relaxed mb-5">You are One. Zero is your digital working intelligence. Behind Zero can be an entire team of specialist capabilities working for your business.</p><p className="text-nx-muted leading-relaxed">Zero develops an increasingly useful understanding of how your business works, what matters to you, your customers, team, systems, decisions and what has or hasn't worked before.</p></div>
          <div className="space-y-3">{[['One','You remain the human principal.'],['Zero','Your persistent digital working intelligence.'],['Team','Specialist AI capabilities and people coordinated around the work.']].map(([t,d])=><div key={t} className="bg-nx-bg border border-nx-border rounded-xl p-5"><h3 className="font-bold text-nx-purple-light">{t}</h3><p className="text-sm text-nx-muted mt-1">{d}</p></div>)}<a href="/your-zero" className="inline-block mt-3 text-sm font-bold text-nx-purple-light hover:text-white">Meet Your Zero →</a></div>
        </div>
      </section>

      <section className="px-6 pb-24">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-10">
            <SectionLabel>Measured Value</SectionLabel>
            <h2 className="text-4xl sm:text-5xl font-extrabold tracking-tight">Five places Titan Zero looks for value.</h2>
            <p className="text-nx-muted text-lg max-w-3xl mx-auto mt-3">These are planning ranges used to identify potential opportunity, not guaranteed savings or returns. Discovery establishes the customer baseline; Titan Zero then measures actual results against it.</p>
          </div>
          <div className="mb-7 bg-nx-surface border border-nx-border rounded-2xl p-6 text-center">
            <div className="text-4xl sm:text-5xl font-black gradient-text">14–25%</div>
            <p className="font-semibold mt-2">estimated annual revenue-equivalent opportunity</p>
            <p className="text-xs text-nx-muted mt-2 max-w-2xl mx-auto">Planning estimate across revenue creation, cost reduction, recovered time and accelerated cash. Resource and environmental improvements are measured separately where practical to avoid double counting.</p>
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
        <div className="absolute inset-0 bg-gradient-to-b from-nx-bg via-blue-900/[0.03] to-nx-bg pointer-events-none" />
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

          {/* Right: managed-system model */}
          <div className="bg-nx-surface border border-nx-border rounded-2xl p-6">
            <p className="text-xs uppercase tracking-widest text-nx-muted2 mb-5">Managed operating model</p>
            <div className="space-y-3">
              {[
                ['01','Keep the systems that already work'],
                ['02','Connect authorised business context'],
                ['03','Fill genuine software and workflow gaps'],
                ['04','Commission specialised workforce capabilities'],
                ['05','Apply governance, review and authority controls'],
                ['06','Measure results and continuously improve'],
              ].map(([n,t]) => <div key={n} className="bg-nx-bg border border-nx-border rounded-xl p-4 flex gap-4"><span className="text-xs font-bold text-nx-purple-light">{n}</span><span className="text-sm">{t}</span></div>)}
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

      {/* ===== CTA ===== */}
      <CTASection />
    </>
  )
}
