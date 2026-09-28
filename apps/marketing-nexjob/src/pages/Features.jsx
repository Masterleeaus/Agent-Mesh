import { Check } from 'lucide-react'
import SectionLabel from '../components/SectionLabel'
import FadeIn from '../components/FadeIn'
import CTASection from '../components/CTASection'

// ── 4 Hero showcase features (alternating layout + visual) ──────────────────
const showcaseFeatures = [
  {
    number: '01',
    label: 'AI Intelligence',
    title: 'AI Quote Advisor',
    tagline: '"Stop guessing on pricing. Start hitting margin."',
    desc: 'Analyzes the job description and automatically suggests line items, quantities, and pricing — targeting your 35% gross margin goal on every quote. Competitors like Jobber give you a blank form. NexJob fills it in for you.',
    points: [
      { bold: 'Margin-first pricing', text: '— AI targets your gross margin goal on every single quote' },
      { bold: 'Auto line items', text: '— drafts parts, labor, and quantities from the job description' },
      { bold: 'Hybrid AI routing', text: '— Gemini Flash for jobs under $1,500, Claude Opus for complex jobs' },
      { bold: 'One-tap approval', text: '— clients approve and pay deposits from their phone, no app needed' },
    ],
    visual: 'quote',
  },
  {
    number: '02',
    label: 'Vision AI',
    title: 'Gemini Vision Estimating',
    tagline: '"Point your phone at a job site. Get an estimate."',
    desc: 'Technicians upload photos of the job site. Gemini Vision analyzes the images and generates a parts and labor estimate automatically — no back-and-forth between the field and the office.',
    points: [
      { bold: 'Photo-to-estimate', text: '— snap a photo, get a priced line-item estimate in seconds' },
      { bold: 'Manager review queue', text: '— AI suggestions route to your inbox before anything is sent' },
      { bold: 'Works anywhere', text: '— techs submit from their phone; you review from your desk' },
      { bold: 'Powered by Gemini 2.5 Flash', text: '— with automatic retry logic for silent failures' },
    ],
    visual: 'vision',
    reverse: true,
  },
  {
    number: '04',
    label: 'Voice AI',
    title: 'Voice-to-Invoice',
    tagline: '"Techs talk. Invoices write themselves."',
    desc: 'Your tech records a 30-second voice note after finishing the job — describing what was done, what parts were used, and how long it took. NexJob transcribes it, extracts every line item, and builds a complete invoice ready to send.',
    points: [
      { bold: 'Hands-free capture', text: '— record from the truck before leaving the job site' },
      { bold: 'Full transcription', text: '— AI extracts parts, labor hours, and descriptions automatically' },
      { bold: 'Review before sending', text: '— you approve or edit before the invoice goes to the client' },
      { bold: 'Works offline', text: '— records locally and syncs when connection is restored' },
    ],
    visual: 'voice',
  },
  {
    number: '06',
    label: 'Payments',
    title: 'Text-to-Pay',
    tagline: '"Customers pay from a text message. Faster than any invoice."',
    desc: 'When an invoice is ready, NexJob sends the customer a Stripe payment link via SMS. They tap it, see the invoice, and pay — no app download, no portal login, no friction.',
    points: [
      { bold: 'Stripe Connect', text: '— money deposits directly into your bank account' },
      { bold: 'Optional tip prompts', text: '— 10/15/20% tip option at checkout, toggled in Settings' },
      { bold: 'Auto QuickBooks sync', text: '— every payment updates your books without lifting a finger' },
      { bold: 'Cuts collection time', text: '— customers pay the same day instead of waiting weeks' },
    ],
    visual: 'payment',
    reverse: true,
  },
]

// ── All 10 features grid ────────────────────────────────────────────────────
const allFeatures = [
  {
    number: '01', icon: '🤖',
    title: 'AI Quote Advisor',
    tagline: 'Stop guessing on pricing. Start hitting margin.',
    desc: 'AI suggests line items, quantities, and pricing targeting your gross margin goal on every quote.',
  },
  {
    number: '02', icon: '📸',
    title: 'Gemini Vision Estimating',
    tagline: 'Point your phone at a job site. Get an estimate.',
    desc: 'Upload a job site photo. Gemini Vision generates a parts and labor estimate automatically.',
  },
  {
    number: '03', icon: '👻',
    title: 'Ghost Dispatching',
    tagline: 'Jobs get assigned before you open your laptop.',
    desc: 'Automatically calculates the closest available tech and assigns them — no dispatcher needed.',
  },
  {
    number: '04', icon: '🎙️',
    title: 'Voice-to-Invoice',
    tagline: 'Techs talk. Invoices write themselves.',
    desc: 'Record a 30-second voice note in the field. NexJob converts it to a complete itemized invoice.',
  },
  {
    number: '05', icon: '💬',
    title: 'AI SMS Gatekeeper',
    tagline: 'Your AI receptionist never sleeps.',
    desc: 'Inbound texts are triaged by AI — spam filtered, leads escalated, bookings handled automatically.',
  },
  {
    number: '06', icon: '💳',
    title: 'Text-to-Pay',
    tagline: 'Customers pay from a text. Faster than any invoice.',
    desc: 'Send a Stripe payment link via SMS. Customers tap and pay in under a minute.',
  },
  {
    number: '07', icon: '📊',
    title: 'Virtual CFO Briefing',
    tagline: 'Your financial summary, every morning at 8 AM.',
    desc: 'AI-generated daily email: revenue vs. target, outstanding invoices, cash flow trends.',
  },
  {
    number: '08', icon: '📦',
    title: 'Inventory & Stock Alerts',
    tagline: 'Never show up missing a part again.',
    desc: 'Track your parts inventory with low-stock alerts. When a job is booked, the system flags items running low so you can reorder in time.',
  },
  {
    number: '09', icon: '🔗',
    title: 'QuickBooks Auto-Sync',
    tagline: 'Zero manual bookkeeping. Ever.',
    desc: 'Every invoice sent and payment received syncs to QuickBooks Online automatically.',
  },
  {
    number: '10', icon: '👤',
    title: 'Customer Portal',
    tagline: 'A self-service hub. No app download required.',
    desc: 'Customers view job history, approve quotes, pay invoices, and book services via magic link.',
  },
]

// ── Visuals ─────────────────────────────────────────────────────────────────
function QuoteVisual() {
  return (
    <div className="bg-nx-bg rounded-xl p-5 border border-nx-border space-y-3">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-bold">Draft Quote — AC Replacement</span>
        <span className="text-[10px] text-nx-purple-light bg-purple-500/10 px-2 py-0.5 rounded font-semibold">AI DRAFT</span>
      </div>
      <div className="border-t border-nx-border pt-3 space-y-1.5">
        {[
          ['Carrier 3-Ton AC Unit', '$2,400'],
          ['Labor — Installation (4 hrs)', '$600'],
          ['Ductwork Modification', '$520'],
          ['Smart Thermostat', '$320'],
        ].map(([item, price]) => (
          <div key={item} className="flex justify-between text-xs">
            <span className="text-nx-muted flex-1">{item}</span>
            <span>{price}</span>
          </div>
        ))}
        <div className="flex justify-between text-sm font-bold pt-2 border-t border-nx-border mt-1">
          <span>Total</span>
          <span className="text-nx-green">$3,840</span>
        </div>
      </div>
      <div className="bg-green-500/8 border border-green-500/20 rounded-lg p-2.5">
        <p className="text-[10px] text-nx-green font-semibold">🧠 AI MARGIN CHECK</p>
        <p className="text-xs text-nx-muted mt-1">Gross margin: 38% — above your 35% target. Pricing looks good to send.</p>
      </div>
    </div>
  )
}

function VisionVisual() {
  return (
    <div className="bg-nx-bg rounded-xl p-5 border border-nx-border space-y-3">
      <div className="flex items-center gap-3 mb-2">
        <div className="w-9 h-9 bg-nx-surface2 rounded-lg flex items-center justify-center text-lg">📸</div>
        <div>
          <p className="text-xs font-semibold">job_site_photo.jpg</p>
          <p className="text-[10px] text-nx-muted">Gemini Vision analyzing...</p>
        </div>
      </div>
      <div className="bg-purple-500/8 border border-purple-500/20 rounded-lg p-3">
        <p className="text-[10px] text-nx-purple-light font-semibold uppercase tracking-wide">Vision AI Estimate</p>
        <div className="space-y-1.5 mt-2">
          {[
            ['Condenser unit replacement', '$1,800'],
            ['Refrigerant recharge (3 lbs)', '$285'],
            ['Contactor replacement', '$95'],
          ].map(([item, price]) => (
            <div key={item} className="flex justify-between text-xs">
              <span className="text-nx-muted">{item}</span>
              <span>{price}</span>
            </div>
          ))}
        </div>
        <div className="flex justify-between text-sm font-bold pt-2 mt-1 border-t border-purple-500/20">
          <span>Estimated Total</span>
          <span className="text-nx-purple-light">$2,180</span>
        </div>
      </div>
      <p className="text-[10px] text-nx-muted2">→ Sent to manager review queue. Awaiting approval before sending to client.</p>
    </div>
  )
}

function VoiceVisual() {
  return (
    <div className="bg-nx-bg rounded-xl p-5 border border-nx-border space-y-3">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-bold">Job #4821 — Voice Note</span>
        <span className="text-[10px] text-red-400 bg-red-500/10 px-2 py-0.5 rounded font-semibold animate-pulse">● REC 0:28</span>
      </div>
      <div className="bg-nx-surface2 border border-nx-border rounded-lg p-3">
        <p className="text-[10px] text-nx-muted uppercase tracking-wide font-semibold mb-2">Transcribed</p>
        <p className="text-xs text-nx-muted italic leading-relaxed">
          "Replaced the pressure relief valve, 45 minutes labor. Used one Watts 3/4-inch valve from stock. Also tightened the supply line — no extra charge for that."
        </p>
      </div>
      <div className="bg-green-500/8 border border-green-500/20 rounded-lg p-3">
        <p className="text-[10px] text-nx-green font-semibold uppercase tracking-wide mb-2">AI Invoice Draft</p>
        <div className="space-y-1.5">
          {[
            ['Watts 3/4" Pressure Relief Valve', '$68'],
            ['Labor — Valve Replacement (0.75 hr)', '$112'],
          ].map(([item, price]) => (
            <div key={item} className="flex justify-between text-xs">
              <span className="text-nx-muted flex-1">{item}</span>
              <span className="text-nx-text">{price}</span>
            </div>
          ))}
          <div className="flex justify-between text-sm font-bold pt-2 border-t border-green-500/20 mt-1">
            <span>Total</span>
            <span className="text-nx-green">$180</span>
          </div>
        </div>
      </div>
      <p className="text-[10px] text-nx-muted2">→ Ready for your review. Tap to send or edit.</p>
    </div>
  )
}

function PaymentVisual() {
  return (
    <div className="bg-nx-bg rounded-xl p-5 border border-nx-border">
      <p className="text-[10px] text-nx-muted2 uppercase tracking-widest text-center mb-3">Customer receives</p>
      <div className="bg-nx-surface2 border border-nx-border rounded-xl p-4 max-w-[240px] mx-auto">
        <p className="text-[10px] text-nx-muted">From: Acme HVAC via NexJob</p>
        <p className="text-sm font-semibold mt-1">Your invoice is ready — $850.00</p>
        <p className="text-xs text-nx-muted mt-1">Tap below to pay securely →</p>
        <div className="mt-3 bg-nx-purple text-white text-xs font-bold text-center py-2 rounded-lg">Pay $850.00</div>
        <div className="flex justify-center gap-3 mt-2">
          <span className="text-[10px] text-nx-muted2">💳 Card</span>
          <span className="text-[10px] text-nx-muted2"> Apple Pay</span>
          <span className="text-[10px] text-nx-muted2">🏦 ACH</span>
        </div>
      </div>
      <div className="mt-4 text-center space-y-0.5">
        <p className="text-[10px] text-nx-green font-semibold">✓ Paid in 4 minutes</p>
        <p className="text-[10px] text-nx-muted2">Auto-synced to QuickBooks</p>
      </div>
    </div>
  )
}

const visuals = { quote: QuoteVisual, vision: VisionVisual, voice: VoiceVisual, payment: PaymentVisual }

export default function Features() {
  return (
    <>
      {/* Hero */}
      <section className="pt-32 pb-16 px-6 text-center">
        <div className="max-w-7xl mx-auto">
          <SectionLabel>Top 10 Features</SectionLabel>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight leading-tight mb-4">
            Field Service Management.<br />
            <span className="text-nx-purple-light">Built for the AI Era.</span>
          </h1>
          <p className="text-lg text-nx-muted max-w-2xl mx-auto leading-relaxed">
            10 AI-powered features that eliminate busywork, accelerate cash flow, and make your
            operation run like it has a team twice its size.
          </p>
        </div>
      </section>

      {/* 4 Hero Showcase Sections */}
      {showcaseFeatures.map((section) => {
        const Visual = visuals[section.visual]
        return (
          <section key={section.number} className="py-20 px-6 border-t border-nx-border">
            <div className="max-w-7xl mx-auto">
              <div className={`grid grid-cols-1 lg:grid-cols-2 gap-16 items-center ${section.reverse ? 'lg:[direction:rtl]' : ''}`}>
                <FadeIn className={section.reverse ? 'lg:[direction:ltr]' : ''}>
                  <div className="inline-flex items-center gap-2 mb-3">
                    <span className="text-[10px] font-bold text-nx-purple-light bg-nx-purple-glow px-2 py-0.5 rounded uppercase tracking-wider">{section.label}</span>
                    <span className="text-[10px] font-semibold text-nx-muted2">Feature {section.number}</span>
                  </div>
                  <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight leading-tight mb-2">
                    {section.title}
                  </h2>
                  <p className="text-nx-purple-light text-sm font-medium italic mb-4">{section.tagline}</p>
                  <p className="text-nx-muted text-base leading-relaxed mb-6">{section.desc}</p>
                  <div className="space-y-3">
                    {section.points.map((p) => (
                      <div key={p.bold} className="flex gap-2.5 items-start">
                        <Check size={16} className="text-nx-green mt-0.5 flex-shrink-0" />
                        <p className="text-sm text-nx-muted">
                          <strong className="text-nx-text">{p.bold}</strong> {p.text}
                        </p>
                      </div>
                    ))}
                  </div>
                </FadeIn>
                <FadeIn delay={100} className={section.reverse ? 'lg:[direction:ltr]' : ''}>
                  <div className="bg-nx-surface border border-nx-border rounded-2xl p-6">
                    <Visual />
                  </div>
                </FadeIn>
              </div>
            </div>
          </section>
        )
      })}

      {/* All 10 Features Grid */}
      <section className="py-20 px-6 border-t border-nx-border">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <SectionLabel>The Complete Platform</SectionLabel>
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight mt-2 mb-3">
              All 10 AI-Powered Features
            </h2>
            <p className="text-nx-muted max-w-xl mx-auto">
              Every feature works together. Schedule a job, dispatch a tech, collect payment, and sync your books — all automatically.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {allFeatures.map((f, i) => (
              <FadeIn key={f.number} delay={i * 50}>
                <div className="bg-nx-surface border border-nx-border rounded-2xl p-5 h-full flex flex-col hover:border-nx-purple hover:-translate-y-0.5 transition-all hover:shadow-lg hover:shadow-black/20">
                  <div className="flex items-start justify-between mb-3">
                    <span className="text-2xl">{f.icon}</span>
                    <span className="text-[10px] font-bold text-nx-muted2 bg-nx-surface2 px-2 py-0.5 rounded">{f.number}</span>
                  </div>
                  <h3 className="text-sm font-bold mb-1">{f.title}</h3>
                  <p className="text-[11px] text-nx-purple-light italic mb-2 font-medium">{f.tagline}</p>
                  <p className="text-xs text-nx-muted leading-relaxed flex-1">{f.desc}</p>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      <CTASection
        title="See all 10 features in action"
        subtitle="Start your free 14-day trial. No credit card. No contracts. Cancel anytime."
      />
    </>
  )
}
