import { Link } from 'react-router-dom'
import SectionLabel from '../components/SectionLabel'
import CTASection from '../components/CTASection'

const capabilityPages=[
['Your Zero','/your-zero','Your persistent digital working intelligence learns you, your role, corrections, experience and the business context you are authorised to use.'],
['AI Workforce','/ai-workforce','Your Zero coordinates appropriate specialist capabilities so owners, staff and customers do not have to choose and micromanage agents or models.'],
['Intelligence & Decisions','/intelligence-decisions','Evidence, uncertainty, investigation, multiple perspectives, consequences and governed decision support.'],
['Continuous Evolution','/continuous-evolution','Observe meaningful change, reassess assumptions and evolve configuration as the business changes.'],
['Existing Systems & Integrations','/existing-systems','Keep useful CRM, accounting, booking, phone and field systems; connect them and fill genuine gaps.'],
['Chat, Voice, Camera & Location','/real-world-intelligence','Talk to Zero, show it the physical world and bring spatial and communication context into the work.'],
['Command, Go & Hub','/apps','Personal Zero experiences for owners and managers, staff and field teams, and customers around the same governed business environment.'],
['Privacy & Architecture','/privacy-architecture','Local-first options, governed context, customer-controlled infrastructure and company-scoped architecture.'],
['Cost Sovereignty','/cost-sovereignty','Use your providers, keys, models and compute where suitable, with explicit Titan-managed options.'],
['Security, Evidence & Recovery','/security-recovery','Protect learning and execution, preserve provenance and retain history around important changes.'],
['Measured Outcomes','/measured-outcomes','Compare baseline, expected and actual results so experience improves future decisions.'],
['Environmental Intelligence','/environmental-systems','Connect environmental evidence, risk, resource efficiency and improvement to normal business operations.'],
['Trust & Authority','/fully-managed','Progress from observation toward bounded automation without confusing intelligence with permission to act.'],
]
const fieldCapabilities=[
['Reception & communications','Enquiries, qualification, booking, reminders, updates and follow-up.'],
['Scheduling & coordination','Recurring work, teams, locations, exceptions and operational next actions.'],
['Quotes & proposals','Prepare structured work from customer, property, history and approved business knowledge.'],
['Field operations','Bring job, customer, location, knowledge and change context closer to field teams.'],
['Evidence & visual workflows','Connect authorised photos, documents, notes and camera input to operational records.'],
['Customer care','Keep service communication, issues, feedback, repeat work and retention moving.'],
['Billing workflow','Move authorised completed work toward invoicing and payment through selected systems.'],
['Inventory & procurement','Connect consumables, stock, purchasing, suppliers and resource use to operations.'],
['Private business knowledge','Use governed company knowledge and private retrieval options for relevant context.'],
['Software gap filling','Add Titan Zero software and interfaces when the existing stack genuinely lacks a capability.'],
]
export default function Features(){return <><section className="pt-32 pb-16 px-6 text-center"><div className="max-w-6xl mx-auto"><SectionLabel>Capabilities</SectionLabel><h1 className="text-4xl sm:text-6xl font-extrabold mb-5">One connected business.<br/><span className="text-nx-purple-light">Many Zeros. Many capabilities.</span></h1><p className="text-lg text-nx-muted max-w-3xl mx-auto">Features is the map of Titan Zero, not a fixed SaaS checklist. Every account holder can have their own Zero, connected to the appropriate business reality, intelligence, workforce, integrations and real-world capabilities for their role.</p></div></section>
<section className="px-6 pb-24"><div className="max-w-7xl mx-auto grid md:grid-cols-2 lg:grid-cols-3 gap-5">{capabilityPages.map(([t,path,d],i)=><Link key={path} to={path} className="group bg-nx-surface border border-nx-border rounded-2xl p-7 hover:bg-nx-surface2 transition-colors"><div className="text-xs font-bold text-nx-purple-light mb-3">{String(i+1).padStart(2,'0')}</div><h2 className="text-xl font-bold mb-3 group-hover:text-nx-purple-light transition-colors">{t}</h2><p className="text-sm text-nx-muted leading-relaxed">{d}</p><p className="text-sm font-bold text-nx-purple-light mt-5">Explore →</p></Link>)}</div></section>
<section className="py-20 px-6 border-y border-nx-border"><div className="max-w-7xl mx-auto"><div className="text-center mb-12"><SectionLabel>Field Services</SectionLabel><h2 className="text-4xl font-extrabold mb-3">The architecture becomes practical capability.</h2><p className="text-nx-muted max-w-2xl mx-auto">The shared Titan Zero system is configured around the workflows, terminology, knowledge and operating reality of each field-service business.</p></div><div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-4">{fieldCapabilities.map(([t,d])=><div key={t} className="bg-nx-surface border border-nx-border rounded-2xl p-5"><h3 className="font-bold mb-2">{t}</h3><p className="text-xs text-nx-muted leading-relaxed">{d}</p></div>)}</div></div></section>
<section className="py-20 px-6"><div className="max-w-5xl mx-auto text-center"><SectionLabel>One + Zero + Team</SectionLabel><h2 className="text-4xl font-extrabold mb-5">Complexity behind Zero.</h2><p className="text-lg text-nx-muted">Each One works through their own Zero rather than selecting models, APIs or agents. Titan coordinates the appropriate capabilities, connected systems and evidence behind the interaction, while authority remains separately governed for that person, role and relationship.</p></div></section>
<CTASection title="Build the capability around your operation." subtitle="Keep what works, connect the business, fill the gaps and manage the resulting intelligence system as one Titan Zero environment."/></>}