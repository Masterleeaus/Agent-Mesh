import SectionLabel from '../components/SectionLabel'
import CTASection from '../components/CTASection'
import { Check } from 'lucide-react'

const steps = [
  ['Assess', 'We map your workflows, existing software, information flows, pain points and operating constraints.'],
  ['Integrate', 'We connect Titan Zero to the systems worth keeping instead of forcing a rip-and-replace migration.'],
  ['Fill the gaps', 'Where the business is missing software, interfaces or workflow capability, Titan Zero can add the extra software needed around the existing stack.'],
  ['Configure the workforce', 'We configure specialised Advanced Intelligence workers, knowledge, permissions, review points and operating rules for your business.'],
  ['Operate and improve', 'We manage, monitor, maintain and improve the system as the business, software and workflows change.'],
]

const trustStages = [
  ['Observe', 'Titan Zero watches authorised workflows and builds context without taking action.'],
  ['Recommend', 'The workforce surfaces recommendations and the evidence behind them.'],
  ['Prepare', 'It prepares the proposed action, message, booking, document or workflow for review.'],
  ['Ask & execute', 'An authorised person approves the prepared action before execution.'],
  ['Trusted automation', 'Repeated, bounded actions can run automatically inside explicitly approved limits.'],
  ['Autonomous', 'Approved capabilities can operate independently within their authority, risk and governance boundaries.'],
  ['Predictive', 'The system can anticipate needs and prepare or perform approved responses within those same boundaries.'],
]

const handshake = [
  'Capability evidence: the system has demonstrated the task reliably enough for the proposed level.',
  'Authority approval: an authorised human or business authority explicitly approves the higher level and its limits.',
  'Governance acceptance: risk, permissions, scope, monitoring and rollback requirements are satisfied before activation.',
]
export default function ManagedSystem(){return <><section className="pt-32 pb-16 px-6 text-center"><div className="max-w-5xl mx-auto"><SectionLabel>Fully Managed</SectionLabel><h1 className="text-4xl sm:text-6xl font-extrabold mb-5">You run the business.<br/><span className="text-nx-purple-light">We manage the intelligence system.</span></h1><p className="text-lg text-nx-muted max-w-3xl mx-auto">Titan Zero is not a box of AI tools you are expected to configure yourself. We implement a managed Advanced Intelligence workforce around your business, keep the systems that already work, fill software gaps where needed, and manage the resulting system with you.</p></div></section><section className="px-6 pb-24"><div className="max-w-5xl mx-auto grid md:grid-cols-2 gap-5">{steps.map(([t,d],i)=><div key={t} className="bg-nx-surface border border-nx-border rounded-2xl p-7"><div className="text-xs text-nx-purple-light font-bold mb-2">0{i+1}</div><h2 className="text-xl font-bold mb-2">{t}</h2><p className="text-sm text-nx-muted leading-relaxed">{d}</p></div>)}</div></section><section className="py-24 px-6 border-y border-nx-border"><div className="max-w-6xl mx-auto"><div className="text-center mb-12"><SectionLabel>Progressive Trust</SectionLabel><h2 className="text-4xl sm:text-5xl font-extrabold mb-4">Automation is earned, not assumed.</h2><p className="text-nx-muted max-w-3xl mx-auto">Titan Zero can progress a capability through defined trust levels as evidence, authority and governance mature. A more capable model or agent does not automatically gain permission to act.</p></div><div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">{trustStages.map(([t,d],i)=><div key={t} className="bg-nx-surface border border-nx-border rounded-2xl p-6"><div className="text-xs font-bold text-nx-purple-light mb-2">0{i+1}</div><h3 className="font-bold mb-2">{t}</h3><p className="text-sm text-nx-muted leading-relaxed">{d}</p></div>)}</div><div className="mt-10 bg-nx-surface border border-nx-border rounded-2xl p-8"><h3 className="text-2xl font-bold mb-2">Three-way handshake before a trust increase</h3><p className="text-sm text-nx-muted mb-5">Moving a capability upward requires all three conditions — not merely an AI confidence score.</p><div className="grid md:grid-cols-3 gap-4">{handshake.map(x=><div key={x} className="flex gap-3 text-sm text-nx-muted"><Check size={17} className="text-nx-green shrink-0 mt-0.5"/><span>{x}</span></div>)}</div><p className="text-xs text-nx-muted2 mt-5">Trust is capability-specific and bounded by the business, company, permissions and approved operating scope. Higher trust does not create unrestricted authority.</p></div></div></section><CTASection title="Employ an intelligence workforce without becoming an AI engineer." subtitle="Titan Zero handles implementation, integration, configuration and ongoing management around your business."/></>}