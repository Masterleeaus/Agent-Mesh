import SectionLabel from '../components/SectionLabel'

const releases = [
  {
    version: 'v1.5',
    date: 'March 20, 2026',
    tag: 'Latest',
    tagColor: 'text-nx-green bg-green-500/10',
    changes: [
      { type: 'new', text: 'Google Calendar Sync — jobs auto-create/update/delete calendar events' },
      { type: 'new', text: 'Annual billing toggle on the Pricing page — save 20% with annual plans' },
      { type: 'new', text: 'Trial expiry nudge banner on Dashboard — color-coded urgency (blue → amber → red)' },
      { type: 'new', text: 'Onboarding wizard for new accounts — guided setup flow on first login' },
      { type: 'fix', text: 'Stripe webhook stability — resolved 500 errors from Stripe API breaking change' },
      { type: 'fix', text: 'Google OAuth — resolved "Access Blocked" error for new sign-ins' },
    ],
  },
  {
    version: 'v1.4',
    date: 'March 15, 2026',
    tag: null,
    changes: [
      { type: 'new', text: 'Passkey & biometric login — sign in with Face ID / Touch ID on any device' },
      { type: 'new', text: 'Push notifications — browser push alerts for job assignments and status changes' },
      { type: 'new', text: 'Email template editor — customize invoice, quote, and follow-up email templates' },
      { type: 'new', text: 'AI Checklist Generation — auto-generates safety checklists per job type on creation' },
      { type: 'improvement', text: 'Audit log — tamper-evident record of every create, update, and delete action' },
    ],
  },
  {
    version: 'v1.3',
    date: 'March 10, 2026',
    tag: null,
    changes: [
      { type: 'new', text: 'Gemini Vision Estimating — photo-to-estimate AI with manager review queue' },
      { type: 'new', text: 'Job Costing dashboard — real-time labor + material cost vs. revenue per job' },
      { type: 'new', text: 'Deposit requests — request a % deposit on any job with auto Stripe checkout' },
      { type: 'new', text: 'QuickBooks Online integration — invoices and payments sync automatically' },
      { type: 'improvement', text: 'Route optimization — Haversine-based job ordering with Google Maps link' },
    ],
  },
  {
    version: 'v1.2',
    date: 'March 5, 2026',
    tag: null,
    changes: [
      { type: 'new', text: 'Text-to-Pay — Stripe payment links delivered via SMS on invoice send' },
      { type: 'new', text: 'Customer Portal — magic-link self-service hub for job history, quotes, and payments' },
      { type: 'new', text: 'AI SMS Gatekeeper — inbound SMS triage, booking intent detection, auto-responses' },
      { type: 'new', text: 'Ghost Dispatching — automatic nearest-tech job assignment via SolidQueue' },
      { type: 'fix', text: 'Appointment reminders now cancel correctly when a job is rescheduled or cancelled' },
    ],
  },
  {
    version: 'v1.1',
    date: 'March 1, 2026',
    tag: null,
    changes: [
      { type: 'new', text: 'AI Quote Advisor — margin-first line item suggestions powered by Claude + Gemini' },
      { type: 'new', text: 'Microsoft 365 integration — Outlook Calendar sync and Teams notifications' },
      { type: 'new', text: 'Predictive Inventory — reorder suggestions and auto-draft purchase orders' },
      { type: 'new', text: 'Virtual CFO Briefing — daily 8 AM AI financial summary via email' },
      { type: 'improvement', text: 'Job scheduling performance — 3× faster calendar load for accounts with 500+ jobs' },
    ],
  },
]

const typeStyles = {
  new:         { label: 'New',         cls: 'text-nx-green bg-green-500/10' },
  fix:         { label: 'Fix',         cls: 'text-yellow-400 bg-yellow-500/10' },
  improvement: { label: 'Improved',    cls: 'text-nx-cyan bg-cyan-500/10' },
}

export default function Changelog() {
  return (
    <>
      <section className="pt-32 pb-16 px-6 text-center">
        <div className="max-w-7xl mx-auto">
          <SectionLabel>Changelog</SectionLabel>
          <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight leading-tight mb-4">
            What's New in<br />
            <span className="text-nx-purple-light">NexJob</span>
          </h1>
          <p className="text-lg text-nx-muted max-w-xl mx-auto">
            Every release, every improvement — shipped fast, documented clearly.
          </p>
        </div>
      </section>

      <section className="px-6 pb-24">
        <div className="max-w-3xl mx-auto space-y-10">
          {releases.map((release) => (
            <div key={release.version} className="relative pl-6 border-l-2 border-nx-border">
              <div className="absolute -left-[9px] top-1.5 w-4 h-4 rounded-full bg-nx-purple border-2 border-nx-bg" />
              <div className="flex items-center gap-3 mb-4">
                <h2 className="text-xl font-extrabold">{release.version}</h2>
                {release.tag && (
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${release.tagColor}`}>
                    {release.tag}
                  </span>
                )}
                <span className="text-xs text-nx-muted">{release.date}</span>
              </div>
              <div className="space-y-2">
                {release.changes.map((c, i) => {
                  const style = typeStyles[c.type] || typeStyles.improvement
                  return (
                    <div key={i} className="flex items-start gap-3">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded flex-shrink-0 mt-0.5 ${style.cls}`}>
                        {style.label}
                      </span>
                      <p className="text-sm text-nx-muted leading-relaxed">{c.text}</p>
                    </div>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      </section>
    </>
  )
}
