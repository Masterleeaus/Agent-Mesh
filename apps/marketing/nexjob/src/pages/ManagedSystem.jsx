import { Link } from 'react-router-dom'
import SectionLabel from '../components/SectionLabel'
import CTASection from '../components/CTASection'
import { Check } from 'lucide-react'

const steps = [
  ['Map the operation', 'Set up cleaning services, sites and properties, team roles, quote rules, recurring work, existing software and the handoffs that slow the business down.'],
  ['Connect useful tools', 'Keep software that works and connect it to the cleaning workflow where an approved integration is available.'],
  ['Configure the workforce', 'Set responsibilities for reception, sales, bookings, scheduling, job operations and customer care, with the right context and escalation points.'],
  ['Launch the workflow', 'Connect enquiry capture, quotes, bookings, assignments, checklists, evidence, billing and customer communications around the company’s real services.'],
  ['Operate and improve', 'Monitor delivery, review exceptions, maintain integrations and equipment workflows, and update the setup as the team and services change.'],
]

const safeguards = [
  'Company service scope and pricing are explicitly configured; the system does not invent rates or service inclusions.',
  'Team roles, approval limits, channel consent and purchasing rules remain under the business’s control.',
  'Required checklists and accepted evidence are linked to each visit before completion is confirmed.',
  'Sensitive or gated service work is offered only when the company’s required skills, equipment, procedures and review are in place.',
  'AI Assist prepares and explains work; financial status and consequential business changes come from authorised workflows and verified records.',
]

export default function ManagedSystem() {
  return <>
    <main>
      <section className="pt-32 pb-16 px-6 text-center"><div className="max-w-5xl mx-auto"><SectionLabel>Managed service for Cleaning</SectionLabel><h1 className="text-4xl sm:text-6xl font-extrabold mb-5">We set up and manage the system around your cleaning team.</h1><p className="text-lg text-nx-muted max-w-3xl mx-auto leading-relaxed">Titan Zero managed service helps you connect your people, cleaning workflows and business software, then keeps the system healthy as the operation changes. You choose the work, the rules and the decisions your team wants to delegate.</p></div></section>

      <section className="px-6 pb-24"><div className="max-w-5xl mx-auto grid md:grid-cols-2 gap-5">{steps.map(([title, description], index) => <article key={title} className="bg-nx-surface border border-nx-border rounded-2xl p-7"><div className="text-xs text-nx-purple-light font-bold mb-3">0{index + 1}</div><h2 className="text-xl font-bold mb-2">{title}</h2><p className="text-sm text-nx-muted leading-relaxed">{description}</p></article>)}</div></section>

      <section className="py-20 px-6 border-y border-nx-border bg-nx-surface/30"><div className="max-w-6xl mx-auto grid lg:grid-cols-[0.9fr_1.1fr] gap-10"><div><SectionLabel>Clear boundaries</SectionLabel><h2 className="text-3xl sm:text-4xl font-extrabold mb-5">The business stays in charge.</h2><p className="text-nx-muted leading-relaxed">The workforce can handle more as the company configures and approves it. Authority stays attached to people, company roles and explicit operating rules.</p></div><ul className="space-y-4">{safeguards.map((item) => <li key={item} className="flex gap-3 text-sm text-nx-muted leading-relaxed"><Check size={17} className="text-nx-green shrink-0 mt-0.5" /><span>{item}</span></li>)}</ul></div></section>

      <section className="px-6 py-16"><div className="max-w-6xl mx-auto flex flex-wrap gap-5 border-t border-nx-border pt-7"><Link to="/features" className="text-sm font-semibold text-nx-purple-light">Explore system features →</Link><Link to="/ai-workforce" className="text-sm font-semibold text-nx-purple-light">Meet the workforce →</Link><Link to="/titan-zero" className="text-sm font-semibold text-nx-purple-light">What is Titan Zero? →</Link></div></section>
      <CTASection title="Give your cleaning operation a system that keeps moving." subtitle="We configure the workforce and workflows around your services, team, customers and existing software." buttonText="Sign up" />
    </main>
  </>
}
