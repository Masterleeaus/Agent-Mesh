import { useState } from 'react'
import SectionLabel from '../components/SectionLabel'
import { ButtonPrimary } from '../components/Button'

const values = [
  {
    icon: '🎯',
    title: 'Field-First Design',
    desc: "Every feature is tested in the field, not just the office. If it doesn't work in a basement with no signal, it doesn't ship.",
  },
  {
    icon: '🤖',
    title: 'AI That Works For You',
    desc: 'Not AI for the sake of AI. Every automation saves real time, earns real money, or prevents a real mistake.',
  },
  {
    icon: '💰',
    title: 'Fair Pricing, Always',
    desc: 'No punitive per-user fees. No paywalling essential features. You grow, your price stays reasonable.',
  },
  {
    icon: '🔓',
    title: 'Your Data, Your Business',
    desc: 'Export everything, anytime. No lock-in. We earn your business every month, not through contracts.',
  },
]

export default function About() {
  const [submitted, setSubmitted] = useState(false)

  return (
    <>
      {/* Hero */}
      <section className="pt-32 pb-16 px-6 text-center">
        <div className="max-w-7xl mx-auto">
          <SectionLabel>About</SectionLabel>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight leading-tight mb-4">
            Built alongside the trades.<br />
            <span className="text-nx-purple-light">For the trades.</span>
          </h1>
          <p className="text-lg text-nx-muted max-w-xl mx-auto leading-relaxed">
            NexJob was built by someone who's worked closely with trade professionals for years and saw firsthand how badly they needed better, more affordable software.
          </p>
        </div>
      </section>

      {/* Content + Form */}
      <section className="px-6 pb-24">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-16">
          {/* Left: Story + Values */}
          <div>
            <h3 className="text-2xl font-bold mb-4">Why NexJob Exists</h3>
            <div className="space-y-4 text-nx-muted leading-relaxed">
              <p>
                Every field service platform promises to "simplify your business." But when you're knee-deep in a crawl space with no cell signal, or your dispatcher just double-booked your best tech, or 60% of your estimates are landing in spam folders — "simple" feels like a lie.
              </p>
              <p>
                NexJob is different because it was built by someone who's been in the trenches with trade pros — seeing the gaps, hearing the complaints, and understanding what actually matters on a job site. We know that offline access isn't a "nice-to-have" — it's a requirement. That route optimization isn't a luxury — it's money in your pocket. That AI scheduling isn't the future — it's overdue.
              </p>
              <p>
                We're building the platform we wished existed: powerful enough for a 50-person operation, simple enough for a solo handyman, and priced fairly for everyone in between.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-10">
              {values.map((v) => (
                <div key={v.title} className="bg-nx-surface border border-nx-border rounded-xl p-5">
                  <div className="text-2xl mb-3">{v.icon}</div>
                  <h4 className="text-sm font-semibold mb-1">{v.title}</h4>
                  <p className="text-xs text-nx-muted leading-relaxed">{v.desc}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Right: Contact Form */}
          <div>
            <div className="bg-nx-surface border border-nx-border rounded-2xl p-8">
              <h3 className="text-lg font-bold mb-1">Get in Touch</h3>
              <p className="text-xs text-nx-muted mb-6">
                Or email directly:{' '}
                <a href="mailto:steve@nexjob.app" className="text-nx-purple-light hover:underline">steve@nexjob.app</a>
              </p>

              {submitted ? (
                <div className="text-center py-12">
                  <div className="text-4xl mb-4">🎉</div>
                  <h4 className="text-xl font-bold mb-2">Message Sent!</h4>
                  <p className="text-sm text-nx-muted">We'll get back to you within 24 hours.</p>
                </div>
              ) : (
                <form
                  action="https://formspree.io/f/nexjob"
                  method="POST"
                  onSubmit={(e) => { e.preventDefault(); setSubmitted(true) }}
                  className="space-y-4"
                >
                  <div>
                    <label className="block text-xs font-medium text-nx-muted mb-1.5">Your Name</label>
                    <input
                      type="text"
                      name="name"
                      required
                      placeholder="John Smith"
                      className="w-full bg-nx-bg border border-nx-border rounded-lg px-4 py-2.5 text-sm text-nx-text outline-none focus:border-nx-purple transition-colors placeholder:text-nx-muted2"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-nx-muted mb-1.5">Email</label>
                    <input
                      type="email"
                      name="email"
                      required
                      placeholder="john@yourbusiness.com"
                      className="w-full bg-nx-bg border border-nx-border rounded-lg px-4 py-2.5 text-sm text-nx-text outline-none focus:border-nx-purple transition-colors placeholder:text-nx-muted2"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-nx-muted mb-1.5">Company</label>
                    <input
                      type="text"
                      name="company"
                      placeholder="Smith Plumbing LLC"
                      className="w-full bg-nx-bg border border-nx-border rounded-lg px-4 py-2.5 text-sm text-nx-text outline-none focus:border-nx-purple transition-colors placeholder:text-nx-muted2"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-nx-muted mb-1.5">Team Size</label>
                    <select
                      name="team_size"
                      className="w-full bg-nx-bg border border-nx-border rounded-lg px-4 py-2.5 text-sm text-nx-text outline-none focus:border-nx-purple transition-colors"
                    >
                      <option value="">Select...</option>
                      <option>Just me</option>
                      <option>2–5 people</option>
                      <option>6–15 people</option>
                      <option>16–50 people</option>
                      <option>50+ people</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-nx-muted mb-1.5">Message</label>
                    <textarea
                      name="message"
                      rows={4}
                      placeholder="Tell us about your business and what you're looking for..."
                      className="w-full bg-nx-bg border border-nx-border rounded-lg px-4 py-2.5 text-sm text-nx-text outline-none focus:border-nx-purple transition-colors resize-y placeholder:text-nx-muted2"
                    />
                  </div>
                  <ButtonPrimary size="lg" className="w-full justify-center">
                    Send Message →
                  </ButtonPrimary>
                </form>
              )}
            </div>
          </div>
        </div>
      </section>
    </>
  )
}
