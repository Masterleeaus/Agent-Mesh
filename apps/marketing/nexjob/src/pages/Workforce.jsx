import SectionLabel from '../components/SectionLabel'
import CTASection from '../components/CTASection'

const capabilities = [
  'Cleaning enquiry intake',
  'Service scope and quote preparation',
  'Recurring booking coordination',
  'Crew skills and assignment context',
  'Property access and preferences',
  'Room and site checklists',
  'Completion evidence and exceptions',
  'Quality review and rework context',
  'Invoice readiness handoff',
  'Customer follow-up and rebooking context',
]

export default function Workforce() {
  return <>
    <section className="pt-32 pb-16 px-6 text-center"><div className="max-w-5xl mx-auto"><SectionLabel>Cleaning AI workforce · in development</SectionLabel><h1 className="text-4xl sm:text-6xl font-extrabold mb-5">Your people work with Zero.<br/><span className="text-nx-purple-light">Specialist capabilities support the cleaning operation.</span></h1><p className="text-lg text-nx-muted max-w-3xl mx-auto">The Cleaning vertical source models how Zero could coordinate the digital parts of a service journey. The catalogue and blueprint cover the areas below, while production execution still depends on released shared workflows, company setup and the correct human authority.</p></div></section>
    <section className="px-6 pb-24"><div className="max-w-6xl mx-auto grid sm:grid-cols-2 lg:grid-cols-3 gap-x-8">{capabilities.map((x, i)=><div key={x} className="border-t border-nx-border py-5"><p className="text-xs text-nx-purple-light font-bold mb-2">{String(i + 1).padStart(2, '0')}</p><h2 className="font-semibold">{x}</h2></div>)}</div></section>
    <section className="py-20 px-6 border-y border-nx-border"><div className="max-w-5xl mx-auto"><h2 className="text-4xl font-extrabold mb-5">Useful proposals. Human authority stays explicit.</h2><p className="text-lg text-nx-muted leading-relaxed mb-5">The Cleaning reference blueprint keeps shared owners responsible for leads, quotes, bookings, scheduling, workforce assignment, jobs, evidence, quality, invoicing, payment reconciliation and rebooking context. It is proposal-only: it does not grant authority or execute those business actions.</p><p className="text-lg text-nx-muted leading-relaxed">Owners and staff are intended to use the business through the work surfaces and channels that are actually released. Channel connections are shown on the Works Everywhere page with their current status.</p></div></section>
    <CTASection title="A workforce built around cleaning work." subtitle="The cleaning catalogue and workflow blueprint are substantial, but a customer installation and production release are still in development."/>
  </>
}
