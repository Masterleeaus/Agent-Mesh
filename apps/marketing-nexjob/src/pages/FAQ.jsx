import { useState } from 'react'
import { ChevronDown } from 'lucide-react'
import SectionLabel from '../components/SectionLabel'
import CTASection from '../components/CTASection'

const faqs = [
  {
    q: 'Is there a free trial?',
    a: 'Yes — every new account gets a 14-day free trial with full access to all features. No credit card required to start.',
  },
  {
    q: 'How is NexJob different from Jobber or ServiceTitan?',
    a: 'NexJob is built AI-first. Features like AI Quote Advisor, Gemini Vision Estimating, Ghost Dispatching, and Voice-to-Invoice are core — not add-ons. We also price fairly: no per-user fees that penalize you for growing your team.',
  },
  {
    q: 'Do I need to sign a long-term contract?',
    a: 'No contracts, ever. NexJob is month-to-month. You can cancel anytime from your billing settings with no cancellation fees.',
  },
  {
    q: 'What trades and industries does NexJob support?',
    a: 'HVAC, Plumbing, Electrical, Landscaping, Cleaning, Handyman, Roofing, Painting, Pest Control, RV Technicians, and more. The platform is flexible enough to work for any field service business.',
  },
  {
    q: 'Does NexJob work on mobile?',
    a: 'Yes. NexJob is a mobile-responsive web app — it works on any smartphone or tablet browser. Technicians can access jobs, upload photos, and log time directly from the field without downloading an app.',
  },
  {
    q: 'How does the AI Quote Advisor work?',
    a: 'You describe the job and NexJob automatically suggests line items, quantities, and pricing — targeting your configured gross margin goal. It routes through Gemini Flash for jobs under $1,500 and Claude Opus for complex or high-value jobs.',
  },
  {
    q: 'What payment methods do customers use to pay invoices?',
    a: 'Credit cards, debit cards, ACH bank transfer, Apple Pay, and Google Pay — all powered by Stripe. Customers can pay from an SMS payment link without downloading anything.',
  },
  {
    q: 'Does NexJob integrate with QuickBooks?',
    a: 'Yes. NexJob has a native QuickBooks Online integration. Every invoice sent and payment received syncs automatically. A manual sync button is also available if you ever need to force a full sync.',
  },
  {
    q: 'Can I connect my Google or Microsoft calendar?',
    a: 'Yes. NexJob connects with both Google Workspace and Microsoft 365. When you schedule or update a job, a calendar event is created or updated automatically.',
  },
  {
    q: 'Is my data secure?',
    a: 'All data is encrypted in transit and at rest. NexJob is hosted on Render with PostgreSQL on secure infrastructure. We never sell your data. You can export everything at any time.',
  },
  {
    q: 'Can I switch plans or cancel at any time?',
    a: 'Yes. You can upgrade, downgrade, or cancel your subscription at any time from your Billing settings. No phone calls, no hoops.',
  },
  {
    q: 'How do I get support?',
    a: 'Email us at steve@nexjob.app. We typically respond within a few hours during business hours. Enterprise plan customers get priority support.',
  },
]

function FAQItem({ q, a }) {
  const [open, setOpen] = useState(false)
  return (
    <div
      className={`border border-nx-border rounded-xl overflow-hidden transition-all ${
        open ? 'border-nx-purple/50' : 'hover:border-nx-border'
      }`}
    >
      <button
        className="w-full flex items-center justify-between gap-4 px-6 py-4 text-left"
        onClick={() => setOpen(!open)}
      >
        <span className="text-sm font-semibold text-nx-text">{q}</span>
        <ChevronDown
          size={16}
          className={`text-nx-muted flex-shrink-0 transition-transform ${
            open ? 'rotate-180' : ''
          }`}
        />
      </button>
      {open && (
        <div className="px-6 pb-5">
          <p className="text-sm text-nx-muted leading-relaxed">{a}</p>
        </div>
      )}
    </div>
  )
}

export default function FAQ() {
  return (
    <>
      <section className="pt-32 pb-16 px-6 text-center">
        <div className="max-w-7xl mx-auto">
          <SectionLabel>FAQ</SectionLabel>
          <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight leading-tight mb-4">
            Frequently Asked<br />
            <span className="text-nx-purple-light">Questions</span>
          </h1>
          <p className="text-lg text-nx-muted max-w-xl mx-auto">
            Everything you need to know before getting started.
          </p>
        </div>
      </section>

      <section className="px-6 pb-24">
        <div className="max-w-3xl mx-auto space-y-3">
          {faqs.map((faq) => (
            <FAQItem key={faq.q} {...faq} />
          ))}
        </div>
        <div className="text-center mt-10">
          <p className="text-sm text-nx-muted">
            Still have questions?{' '}
            <a href="mailto:steve@nexjob.app" className="text-nx-purple-light hover:underline">
              Email us at steve@nexjob.app
            </a>
          </p>
        </div>
      </section>

      <CTASection
        title="Ready to get started?"
        subtitle="14-day free trial. No credit card required. Full access from day one."
      />
    </>
  )
}
