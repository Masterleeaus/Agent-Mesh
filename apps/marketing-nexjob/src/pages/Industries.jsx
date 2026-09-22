import SectionLabel from '../components/SectionLabel'
import FadeIn from '../components/FadeIn'
import CTASection from '../components/CTASection'
import { Link } from 'react-router-dom'

const industries = [
  { icon: '🧹', name: 'Cleaning', slug: 'cleaning', desc: 'Coordinate enquiries, recurring services, team assignments, property notes, checklists, customer communication and follow-up.', tags: ['Recurring Service', 'Team Coordination', 'Property Notes'] },
  { icon: '🌿', name: 'Landscaping & Lawn Care', slug: 'landscaping', desc: 'Keep recurring routes, seasonal work, crews, customer requests and follow-up connected around the systems you already use.', tags: ['Recurring Routes', 'Seasonal Work', 'Crew Coordination'] },
  { icon: '🏊', name: 'Pool Service', slug: 'pools', desc: 'Support recurring visits, service histories, customer communication, technician notes and exception handling across the service cycle.', tags: ['Service History', 'Recurring Visits', 'Customer Updates'] },
  { icon: '💦', name: 'Pressure Washing', slug: 'pressure-washing', desc: 'Move enquiries through assessment, quoting, booking, field evidence, payment and review follow-up without losing context between tools.', tags: ['Lead-to-Job', 'Field Evidence', 'Follow-Up'] },
  { icon: '🐛', name: 'Pest Control', slug: 'pest-control', desc: 'Coordinate bookings, recurring treatments, site history, field records, reminders and customer communication with governed workflows.', tags: ['Recurring Treatments', 'Site History', 'Governed Records'] },
  { icon: '🪟', name: 'Window Cleaning', slug: 'window-cleaning', desc: 'Manage repeat customers, route-aware scheduling, team assignments, service notes and proactive rebooking.', tags: ['Rebooking', 'Scheduling', 'Team Assignment'] },
  { icon: '🏠', name: 'Property Maintenance', slug: 'property-maintenance', desc: 'Coordinate multi-service requests, properties, jobs, field teams, evidence and ongoing customer relationships.', tags: ['Multi-Service', 'Properties', 'Work Coordination'] },
  { icon: '🚐', name: 'Mobile Services', slug: 'mobile-services', desc: 'Support businesses that take the service to the customer with location-aware scheduling, communication, job context and follow-up.', tags: ['Mobile Workforce', 'Location Context', 'Customer Comms'] },
]

export default function Industries() {
  return (
    <>
      {/* Hero */}
      <section className="pt-32 pb-16 px-6 text-center">
        <div className="max-w-7xl mx-auto">
          <SectionLabel>Industries</SectionLabel>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight leading-tight mb-4">
            Built for field service.<br />
            <span className="text-nx-purple-light">Configured for your industry.</span>
          </h1>
          <p className="text-lg text-nx-muted max-w-xl mx-auto leading-relaxed">
            Titan Zero uses a shared operational core, then adapts workforce capabilities, knowledge and workflows for each field-service industry.
          </p>
        </div>
      </section>

      {/* Grid */}
      <section className="px-6 pb-16">
        <div className="max-w-7xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {industries.map((ind, i) => (
            <FadeIn key={ind.name} delay={i * 60}>
              <Link to={`/industries/${ind.slug}`} className="bg-nx-surface border border-nx-border rounded-2xl p-7 transition-all hover:border-nx-purple hover:-translate-y-1 hover:shadow-xl hover:shadow-black/30 cursor-pointer h-full flex flex-col">
                <div className="text-3xl mb-4">{ind.icon}</div>
                <h3 className="text-lg font-bold mb-2">{ind.name}</h3>
                <p className="text-sm text-nx-muted leading-relaxed flex-1 mb-4">{ind.desc}</p>
                <div className="flex flex-wrap gap-1.5">
                  {ind.tags.map((tag) => (
                    <span
                      key={tag}
                      className="text-[10px] font-medium text-nx-purple-light bg-nx-purple-glow px-2 py-0.5 rounded"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
                <span className="text-xs text-nx-purple-light mt-5 font-semibold">Explore {ind.name} →</span>
              </Link>
            </FadeIn>
          ))}
        </div>
      </section>

      <CTASection
        title="Build Titan Zero around your field-service business."
        subtitle="We assess the operation, retain useful systems, fill genuine gaps and configure the managed workforce around your workflows."
      />
    </>
  )
}
