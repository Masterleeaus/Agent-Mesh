import { Link } from 'react-router-dom'
import PageMeta from '../components/PageMeta'
import SectionLabel from '../components/SectionLabel'

const questions = [
  ['What does the Cleaning system do?', 'It connects customer enquiries, CRM, service setup, quotes, bookings, teams, scheduled visits, checklists, evidence, invoices, payments and customer care in one operating workflow.'],
  ['What is Titan Zero?', 'Titan Zero is the layer that manages the cleaning workforce, system, connected tools and business rules. Read the dedicated explanation on the Titan Zero page.'],
  ['What does the AI workforce handle?', 'Six specialist roles support reception, sales, bookings, scheduling, job operations and customer care. They work with the human team and share company-scoped context.'],
  ['What can AI Assist do?', 'AI Assist can interpret requests, extract details from approved context, summarise records, draft quotes and messages, and recommend next steps. It does not decide pricing, availability, permissions, accepted completion or payment state.'],
  ['Are there WordPress plugins and Chrome extensions?', 'Yes. There are five separate products for Bookings, Invoicing, Job Management, Quotes and CRM on each platform. Each includes AI Assist and can be downloaded from your account.'],
  ['Can I use the plugins without connecting Titan Zero?', 'The WordPress products support a standalone local workflow. When connected, company records and authorised actions stay with the Cleaning system.'],
  ['Can staff work through WhatsApp, Telegram or Facebook Messenger?', 'Owners and staff can receive work, ask questions, send updates and handle supported tasks through connected channels. Each action follows company role, consent and approval rules.'],
  ['Which cleaning services can I configure?', 'Residential recurring, one-off and deep cleans; move-in/out and end-of-lease; short-stay; office and commercial; window, pressure, carpet and upholstery; post-construction; and approved company-defined work. Specialist services have their own scope and readiness requirements.'],
  ['How are restricted cleaning services handled?', 'Active construction-site work requires site access, induction and hazard review. Junk removal is limited to approved categories and documented handoff; hazardous and regulated waste stays gated. Medical-equipment cleaning requires verified manufacturer instructions, company procedure, qualified people, suitable equipment and review.'],
  ['How does a job become complete?', 'Required visit tasks and checklists must be completed, and required evidence must be accepted. A draft, click or AI summary does not replace the evidence requirement.'],
  ['How are payments handled?', 'Invoices and payment status use the company’s enabled methods and governed finance workflow. Options can include PayID, bank transfer, cash and supported card methods; reconciliation records partial, duplicate, failed or reversed payments for review.'],
  ['Can Titan Zero manage implementation?', 'Yes. The managed-service option helps map services and software, configure the workforce and workflows, launch the system and maintain it as your operation changes.'],
]

export default function FAQ() {
  return <>
    <PageMeta title="Cleaning System FAQs" description="Answers about the Cleaning workforce, business system, plugins, Chrome extensions, AI Assist, service scope, payments and managed service." />
    <main className="pt-32 pb-24 px-6"><div className="max-w-5xl mx-auto"><SectionLabel>Questions & answers</SectionLabel><h1 className="text-4xl sm:text-5xl font-extrabold mb-5">A clear view of how the Cleaning system works.</h1><p className="text-lg text-nx-muted max-w-3xl mb-10">Learn what is connected, how your team works with it, and where your company’s rules and approvals apply.</p><div className="space-y-3">{questions.map(([question, answer]) => <details key={question} className="group border border-nx-border bg-nx-surface rounded-xl p-5"><summary className="cursor-pointer list-none font-semibold flex items-center justify-between gap-4"><span>{question}</span><span className="text-nx-purple-light group-open:rotate-45 transition-transform" aria-hidden="true">+</span></summary><p className="text-sm text-nx-muted leading-relaxed mt-4 max-w-4xl">{question === 'What is Titan Zero?' ? <>Titan Zero is the layer that manages the cleaning workforce, system, connected tools and business rules. <Link to="/titan-zero" className="text-nx-purple-light">Read the dedicated explanation</Link>.</> : answer}</p></details>)}</div></div></main>
  </>
}
