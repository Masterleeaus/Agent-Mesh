import { useState, useMemo } from 'react'
import { Check } from 'lucide-react'
import SectionLabel from '../components/SectionLabel'
import CTASection from '../components/CTASection'
import { appRoutes } from '../config'

const plans = [
  {
    name: 'Solo',
    monthly: 0,
    annual: 0,
    period: 'Free forever \u00b7 1 user',
    cta: 'Get Started Free',
    ctaStyle: 'outline',
    href: `${appRoutes.signup}?plan=solo`,
    features: [
      'Jobs, invoices & scheduling',
      'Customer portal',
      'SMS notifications',
      'Online booking widget',
      'AI Quote Advisor',
      'Email support',
    ],
  },
  {
    name: 'Crew',
    monthly: 49,
    annual: 39,
    period: 'Up to 5 users \u00b7 +$15/user after',
    cta: 'Start Free Trial',
    ctaStyle: 'primary',
    featured: true,
    badge: 'Most Popular',
    href: `${appRoutes.trial}`,
    features: [
      'Everything in Solo',
      'Quotes & leads pipeline',
      'Recurring jobs',
      'Time tracking & GPS clock-in',
      'QuickBooks sync',
      'Two-way SMS',
      'Automated reminders',
      'Priority email + chat support',
    ],
  },
  {
    name: 'Ops',
    monthly: 129,
    annual: 99,
    period: 'Up to 15 users \u00b7 +$15/user after',
    cta: 'Start Free Trial',
    ctaStyle: 'primary',
    href: `${appRoutes.signup}?plan=ops&trial=true`,
    features: [
      'Everything in Crew',
      'Inventory & purchase orders',
      'Equipment tracking',
      'AI agents & CFO briefing',
      'Dispatch board & live map',
      'Expense tracking',
      'Email campaigns',
      'Phone + chat support',
    ],
  },
  {
    name: 'Scale',
    monthly: 299,
    annual: 249,
    period: 'Unlimited users \u00b7 flat rate',
    cta: 'Start Free Trial',
    ctaStyle: 'outline',
    href: `${appRoutes.signup}?plan=scale&trial=true`,
    features: [
      'Everything in Ops',
      'Offline mode',
      'Webhooks & API access',
      'SMS-to-booking AI',
      'Stripe Connect payments',
      'Full fleet dispatch',
      'Client services AI agent',
    ],
  },
]

const comparisonRows = [
  { feature: 'Included users', jobber: '5 users', nexjob: '5 users', nexjobWin: false },
  { feature: 'Per-user cost after', jobber: '$29/user/mo', nexjob: '$15/user/mo', nexjobWin: true },
  { feature: 'GPS Tracking', jobber: 'Connect plan ($119)', nexjob: '\u2713 Included', nexjobWin: true, jobberPartial: true },
  { feature: 'Two-Way SMS', jobber: 'Grow plan ($199)', nexjob: '\u2713 Included', nexjobWin: true, jobberPartial: true },
  { feature: 'Automated Reminders', jobber: 'Connect plan ($119)', nexjob: '\u2713 Included', nexjobWin: true, jobberPartial: true },
  { feature: 'Custom Email Domain', jobber: '\u2717 Not available', nexjob: '\u2713 Included', nexjobWin: true, jobberNo: true },
  { feature: 'Offline Mode', jobber: '\u2717 Not available', nexjob: '\u2713 Included', nexjobWin: true, jobberNo: true },
  { feature: 'AI Scheduling', jobber: '\u2717 Basic Copilot only', nexjob: '\u2713 Full AI dispatch', nexjobWin: true, jobberNo: true },
  { feature: 'Route Optimization', jobber: '\u2717 "Connect the dots" map', nexjob: '\u2713 Real routing', nexjobWin: true, jobberNo: true },
  { feature: 'Geofencing', jobber: '\u2717 Not available', nexjob: '\u2713 Ops plan ($129)', nexjobWin: true, jobberNo: true },
  { feature: 'Batch Invoicing', jobber: 'Grow plan ($199)', nexjob: '\u2713 Crew plan ($49)', nexjobWin: true, jobberPartial: true },
  { feature: 'Advanced Analytics', jobber: 'Plus plan ($599)', nexjob: 'Ops plan ($129)', nexjobWin: true, jobberPartial: true },
  { feature: 'Job Costing', jobber: 'Grow plan ($199)', nexjob: 'Ops plan ($129)', nexjobWin: false, jobberPartial: true },
  { feature: 'Free Tier', jobber: '\u2717 None', nexjob: '\u2713 Free forever', nexjobWin: true, jobberNo: true },
]

const jobberPlans = {
  core: { base: 39, included: 1, extra: 29, label: 'Core ($39/mo \u00b7 1 user)' },
  connect: { base: 119, included: 5, extra: 29, label: 'Connect ($119/mo \u00b7 5 users)' },
  grow: { base: 199, included: 10, extra: 29, label: 'Grow ($199/mo \u00b7 10 users)' },
  plus: { base: 599, included: 15, extra: 29, label: 'Plus ($599/mo \u00b7 15 users)' },
}

export default function Pricing() {
  const [billing, setBilling] = useState('monthly')
  const [calcUsers, setCalcUsers] = useState(8)
  const [calcPlan, setCalcPlan] = useState('grow')

  const calcResults = useMemo(() => {
    const p = jobberPlans[calcPlan]
    const jobberCost = p.base + Math.max(0, calcUsers - p.included) * p.extra
    let nexjobCost
    if (calcUsers <= 1) nexjobCost = 0
    else if (calcUsers <= 5) nexjobCost = 49
    else if (calcUsers <= 15) nexjobCost = 129
    else nexjobCost = 299
    const savings = (jobberCost - nexjobCost) * 12
    return { jobberCost, nexjobCost, savings }
  }, [calcUsers, calcPlan])

  return (
    <>
      {/* Hero */}
      <section className="pt-32 pb-8 px-6 text-center">
        <div className="max-w-7xl mx-auto">
          <SectionLabel>Pricing</SectionLabel>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight leading-tight mb-4">
            Simple pricing.<br />
            <span className="text-nx-purple-light">Seriously powerful.</span>
          </h1>
          <p className="text-lg text-nx-muted max-w-xl mx-auto leading-relaxed">
            No hidden fees. No feature gates on essentials. Get GPS, SMS, and AI scheduling at prices competitors charge 3x for.
          </p>

          {/* Billing Toggle */}
          <div className="inline-flex bg-nx-surface border border-nx-border rounded-xl p-1 mt-6">
            <button
              onClick={() => setBilling('monthly')}
              className={`text-sm font-medium px-5 py-2 rounded-lg transition-all ${
                billing === 'monthly' ? 'bg-nx-purple text-white' : 'text-nx-muted hover:text-nx-text'
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setBilling('annual')}
              className={`text-sm font-medium px-5 py-2 rounded-lg transition-all ${
                billing === 'annual' ? 'bg-nx-purple text-white' : 'text-nx-muted hover:text-nx-text'
              }`}
            >
              Annual <span className="text-[10px] font-bold text-nx-green ml-1">Save 20%</span>
            </button>
          </div>
        </div>
      </section>

      {/* Pricing Cards */}
      <section className="px-6 py-12">
        <div className="max-w-7xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={`relative bg-nx-surface border rounded-2xl p-6 transition-all hover:-translate-y-1 ${
                plan.featured
                  ? 'border-nx-purple glow-purple'
                  : 'border-nx-border hover:border-nx-purple'
              }`}
            >
              {plan.badge && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-nx-purple text-white text-[10px] font-bold uppercase tracking-wider px-3 py-0.5 rounded-full">
                  {plan.badge}
                </div>
              )}
              <p className="text-xs font-semibold text-nx-muted uppercase tracking-wider mb-2">{plan.name}</p>
              <p className="text-5xl font-extrabold tracking-tight">
                ${billing === 'monthly' ? plan.monthly : plan.annual}
                <span className="text-base font-normal text-nx-muted">/mo</span>
              </p>
              <p className="text-xs text-nx-muted2 mt-1 mb-6">{plan.period}</p>

              <a
                href={plan.isInternal ? undefined : plan.href}
                onClick={plan.isInternal ? () => window.location.href = plan.href : undefined}
                className={`block w-full text-sm font-semibold py-2.5 rounded-lg mb-6 transition-all text-center ${
                  plan.ctaStyle === 'primary'
                    ? 'bg-nx-purple text-white hover:bg-nx-purple-dark'
                    : 'border border-nx-border2 text-nx-text2 hover:border-nx-purple hover:text-nx-text'
                }`}
              >
                {plan.cta}
              </a>

              <ul className="space-y-2.5">
                {plan.features.map((f) => (
                  <li key={f} className="flex gap-2 items-start text-xs text-nx-muted">
                    <Check size={14} className="text-nx-green flex-shrink-0 mt-0.5" />
                    {f}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      {/* Comparison Table */}
      <section className="px-6 py-16">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-extrabold tracking-tight">NexJob vs Jobber</h2>
            <p className="text-nx-muted text-sm mt-2">See what you get at every price point.</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-nx-border">
                  <th className="text-left text-xs font-semibold text-nx-muted uppercase tracking-wider py-3 px-4">Feature</th>
                  <th className="text-left text-xs font-semibold text-nx-muted uppercase tracking-wider py-3 px-4">Jobber ($119\u2013$199/mo)</th>
                  <th className="text-left text-xs font-semibold text-nx-purple-light uppercase tracking-wider py-3 px-4 bg-purple-500/5">NexJob Crew ($49/mo)</th>
                </tr>
              </thead>
              <tbody>
                {comparisonRows.map((row) => (
                  <tr key={row.feature} className="border-b border-nx-border hover:bg-white/[0.02]">
                    <td className="py-3 px-4 font-medium">{row.feature}</td>
                    <td className={`py-3 px-4 ${row.jobberNo ? 'text-nx-muted2' : row.jobberPartial ? 'text-yellow-400 font-medium' : ''}`}>
                      {row.jobber}
                    </td>
                    <td className={`py-3 px-4 bg-purple-500/5 ${row.nexjobWin ? 'text-nx-green font-medium' : ''}`}>
                      {row.nexjob}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* Cost Calculator */}
      <section className="px-6 py-8 pb-16">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-6">
            <h2 className="text-3xl font-extrabold tracking-tight">Switching Cost Calculator</h2>
            <p className="text-nx-muted text-sm mt-2">See how much you'd save switching from Jobber to NexJob.</p>
          </div>
          <div className="bg-nx-surface border border-nx-border rounded-2xl p-8 max-w-3xl mx-auto">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-8">
              <div>
                <label className="block text-sm font-medium text-nx-muted mb-2">How many team members?</label>
                <input
                  type="number"
                  min="1"
                  max="100"
                  value={calcUsers}
                  onChange={(e) => setCalcUsers(Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-full bg-nx-bg border border-nx-border rounded-lg px-4 py-2.5 text-base text-nx-text outline-none focus:border-nx-purple transition-colors"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-nx-muted mb-2">Jobber plan you'd need</label>
                <select
                  value={calcPlan}
                  onChange={(e) => setCalcPlan(e.target.value)}
                  className="w-full bg-nx-bg border border-nx-border rounded-lg px-4 py-2.5 text-base text-nx-text outline-none focus:border-nx-purple transition-colors"
                >
                  {Object.entries(jobberPlans).map(([key, p]) => (
                    <option key={key} value={key}>{p.label}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 pt-6 border-t border-nx-border">
              <div className="text-center">
                <p className="text-3xl font-extrabold text-red-400">${calcResults.jobberCost}</p>
                <p className="text-xs text-nx-muted mt-1">Jobber Monthly Cost</p>
              </div>
              <div className="text-center">
                <p className="text-3xl font-extrabold text-nx-purple-light">${calcResults.nexjobCost}</p>
                <p className="text-xs text-nx-muted mt-1">NexJob Monthly Cost</p>
              </div>
              <div className="text-center">
                <p className={`text-3xl font-extrabold ${calcResults.savings > 0 ? 'text-nx-green' : 'text-nx-muted'}`}>
                  {calcResults.savings > 0 ? `$${calcResults.savings.toLocaleString()}/yr` : '$0/yr'}
                </p>
                <p className="text-xs text-nx-muted mt-1">Your Annual Savings</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <CTASection
        title="Try NexJob free for 14 days"
        subtitle="No credit card required. Full access to every feature. Cancel anytime."
      />
    </>
  )
}
