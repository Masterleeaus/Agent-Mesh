import SectionLabel from '../components/SectionLabel'
import FadeIn from '../components/FadeIn'
import CTASection from '../components/CTASection'

const industries = [
  {
    icon: '❄️',
    name: 'HVAC',
    desc: 'Manage installs, maintenance contracts, and emergency repairs. Track equipment models, warranty dates, and refrigerant usage per unit.',
    tags: ['Equipment Tracking', 'Maintenance Contracts', 'Emergency Dispatch'],
  },
  {
    icon: '🔧',
    name: 'Plumbing',
    desc: 'Quote water heater replacements, schedule drain cleanings, and manage recurring maintenance. Photo documentation for every job.',
    tags: ['Photo Markup', 'Parts Inventory', 'Recurring Jobs'],
  },
  {
    icon: '⚡',
    name: 'Electrical',
    desc: 'Track permits, manage panel upgrades, and schedule inspections. Certification tracking for your licensed electricians.',
    tags: ['Permit Tracking', 'Certifications', 'Inspection Scheduling'],
  },
  {
    icon: '🌿',
    name: 'Landscaping',
    desc: 'Manage weekly mowing routes, seasonal cleanups, and hardscape projects. Recurring schedule templates save hours every week.',
    tags: ['Route Optimization', 'Recurring Schedules', 'Seasonal Templates'],
  },
  {
    icon: '🧹',
    name: 'Cleaning',
    desc: 'Book residential and commercial cleanings with custom checklists. Manage supplies, team assignments, and client preferences.',
    tags: ['Custom Checklists', 'Client Preferences', 'Supply Tracking'],
  },
  {
    icon: '🔨',
    name: 'Handyman',
    desc: 'From honey-do lists to full remodels. Multi-service quoting, time tracking, and a client portal that makes solo operators look big.',
    tags: ['Multi-Service Quotes', 'Time Tracking', 'Before/After Photos'],
  },
  {
    icon: '🏗️',
    name: 'Roofing',
    desc: 'Estimate from instant satellite roof measurements with a configurable waste factor, then order materials only after an on-site field check. Offer homeowners financing right on the proposal, with insurance claim documentation built in.',
    tags: ['Satellite Measurements', 'Field-Verified Ordering', 'Proposal Financing'],
  },
  {
    icon: '🎨',
    name: 'Painting',
    desc: 'Room-by-room quoting, color tracking, and crew scheduling. Calculate paint coverage automatically from measurements.',
    tags: ['Room-by-Room Quotes', 'Coverage Calculator', 'Color Tracking'],
  },
  {
    icon: '🐛',
    name: 'Pest Control',
    desc: 'Schedule treatments, track chemical usage, manage service contracts, and generate compliance reports automatically.',
    tags: ['Chemical Tracking', 'Compliance Reports', 'Service Contracts'],
  },
  {
    icon: '🚐',
    name: 'RV Technicians',
    desc: 'Manage mobile RV repairs, slide-out servicing, and generator maintenance. Track VINs, chassis types, and warranty service history per unit.',
    tags: ['VIN Tracking', 'Mobile Repairs', 'Warranty Service'],
  },
]

export default function Industries() {
  return (
    <>
      {/* Hero */}
      <section className="pt-32 pb-16 px-6 text-center">
        <div className="max-w-7xl mx-auto">
          <SectionLabel>Industries</SectionLabel>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight leading-tight mb-4">
            Built for your trade.<br />
            <span className="text-nx-purple-light">Tuned for your workflow.</span>
          </h1>
          <p className="text-lg text-nx-muted max-w-xl mx-auto leading-relaxed">
            NexJob works for every home and commercial service business — with industry-specific templates, checklists, and pricing built in.
          </p>
        </div>
      </section>

      {/* Grid */}
      <section className="px-6 pb-16">
        <div className="max-w-7xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {industries.map((ind, i) => (
            <FadeIn key={ind.name} delay={i * 60}>
              <div className="bg-nx-surface border border-nx-border rounded-2xl p-7 transition-all hover:border-nx-purple hover:-translate-y-1 hover:shadow-xl hover:shadow-black/30 cursor-pointer h-full flex flex-col">
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
              </div>
            </FadeIn>
          ))}
        </div>
      </section>

      <CTASection
        title="Don't see your trade?"
        subtitle="NexJob is flexible enough for any service business. Start your free trial and customize it for your workflow."
      />
    </>
  )
}
