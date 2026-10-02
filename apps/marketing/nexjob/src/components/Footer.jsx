import { Link } from 'react-router-dom'
import { getCurrentSiteContext } from '../config/siteContext'

const footerLinks = {
  Product: [
    { label: 'Your Zero', path: '/your-zero' },
    { label: 'AI Workforce', path: '/ai-workforce' },
    { label: 'Features', path: '/features' },
    { label: 'Investment', path: '/investment' },
    { label: 'Industries', path: '/industries' },
    { label: 'Fully Managed', path: '/fully-managed' },
    { label: 'Compare', path: '/compare' },
  ],
  Resources: [
    { label: 'Intelligence & Decisions', path: '/intelligence-decisions' },
    { label: 'Continuous Evolution', path: '/continuous-evolution' },
    { label: 'Existing Systems', path: '/existing-systems' },
    { label: 'Measured Outcomes', path: '/measured-outcomes' },
    { label: 'FAQ', path: '/faq' },
    { label: 'Privacy & Architecture', path: '/privacy-architecture' },
    { label: 'Cost Sovereignty', path: '/cost-sovereignty' },
    { label: 'Environmental Systems', path: '/environmental-systems' },
  ],
  Company: [
    { label: 'Command, Go & Hub', path: '/apps' },
    { label: 'Chat, Voice & Camera', path: '/real-world-intelligence' },
    { label: 'Security & Recovery', path: '/security-recovery' },
    { label: 'About', path: '/about' },
    { label: 'System Evolution', path: '/changelog' },
  ],
}

function LegacyFooter() {
  return (
    <footer className="border-t border-nx-border mt-16">
      <div className="max-w-7xl mx-auto px-6 pt-16 pb-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 mb-12">
          {/* Brand */}
          <div>
            <Link to="/" className="flex items-center gap-2 font-extrabold text-lg">
              <span className="w-2 h-2 bg-nx-purple rounded-full" />
              Titan Zero Field Services
            </Link>
            <p className="text-sm text-nx-muted mt-3 max-w-[280px] leading-relaxed">
              Every person can have their own Zero. Owners, staff and customers work through personal digital working intelligence connected to the appropriate business reality and a managed specialist workforce.
            </p>
            <a
              href="mailto:support@titanzero.io"
              className="inline-block mt-4 text-xs text-nx-muted2 hover:text-nx-text transition-colors"
            >
              support@titanzero.io
            </a>
          </div>

          {/* Link Columns */}
          {Object.entries(footerLinks).map(([heading, links]) => (
            <div key={heading}>
              <h4 className="text-xs font-semibold text-nx-muted uppercase tracking-wider mb-4">
                {heading}
              </h4>
              <ul className="space-y-2">
                {links.map(({ label, path, href }) => (
                  <li key={label}>
                    {href ? (
                      <a
                        href={href}
                        className="text-sm text-nx-muted2 hover:text-nx-text transition-colors"
                      >
                        {label}
                      </a>
                    ) : (
                      <Link
                        to={path}
                        className="text-sm text-nx-muted2 hover:text-nx-text transition-colors"
                      >
                        {label}
                      </Link>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="border-t border-nx-border pt-6 flex flex-col sm:flex-row justify-between items-center gap-2">
          <p className="text-xs text-nx-muted2">© 2026 Titan Zero. All rights reserved.</p>
          <p className="text-xs text-nx-muted2">Different person. Different Zero. Same connected business.</p>
        </div>
      </div>
    </footer>
  )
}

function ConfiguredFooter({ context }) {
  const brand = context.kind === 'industry' ? `Titan Zero ${context.site.name}` : 'Titan Zero'
  const columns = context.kind === 'industry'
      ? {
          Cleaning: [['Overview', '/'], ['Workflows', '/#workflows'], ['Features', '/#features'], ['Works Everywhere', '/works-everywhere'], ['Pricing', '/pricing']],
          TitanZero: [['Product platform', 'https://titanzero.io/'], ['Managed service', 'https://titanzero.io/fully-managed']],
        }
      : {
          Product: [['How it works', '/#how-it-works'], ['Cleaning SaaS', '/industries/cleaning'], ['Features', '/features'], ['AI workforce', '/ai-workforce'], ['Works Everywhere', '/works-everywhere'], ['Pricing', '/pricing'], ['Managed service', '/fully-managed']],
          Resources: [['Privacy & architecture', '/privacy-architecture'], ['Cost sovereignty', '/cost-sovereignty'], ['Security & recovery', '/security-recovery'], ['Resources', '/resources']],
          Company: [['About', '/about'], ['System evolution', '/changelog']],
        }

  return <footer className="border-t border-nx-border mt-16">
    <div className="max-w-7xl mx-auto px-6 pt-16 pb-8">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 mb-12">
        <div>
          <Link to="/" className="flex items-center gap-2 font-extrabold text-lg"><span className="w-2 h-2 bg-nx-purple rounded-full" />{brand}</Link>
          <p className="text-sm text-nx-muted mt-3 max-w-[280px] leading-relaxed">{context.kind === 'industry' ? `${context.site.name} product information, workflows and work surfaces.` : 'Titan Zero Cleaning SaaS, its managed-service option and the work surfaces in development.'}</p>
        </div>
        {Object.entries(columns).map(([heading, links]) => <div key={heading}>
          <h4 className="text-xs font-semibold text-nx-muted uppercase tracking-wider mb-4">{heading === 'OtherIndustries' ? 'Other industries' : heading}</h4>
          <ul className="space-y-2">{links.map(([label, href]) => <li key={`${label}-${href}`}>
            {href.startsWith('https://') ? <a href={href} className="text-sm text-nx-muted2 hover:text-nx-text transition-colors">{label}</a> : <Link to={href} className="text-sm text-nx-muted2 hover:text-nx-text transition-colors">{label}</Link>}
          </li>)}</ul>
        </div>)}
      </div>
      <div className="border-t border-nx-border pt-6 flex flex-col sm:flex-row justify-between items-center gap-2">
        <p className="text-xs text-nx-muted2">© 2026 Titan Zero. All rights reserved.</p>
        <p className="text-xs text-nx-muted2">Different person. Different Zero. Same connected business.</p>
      </div>
    </div>
  </footer>
}

export default function Footer() {
  const context = getCurrentSiteContext()
  const publicContext = context.kind === 'preview' ? { ...context, kind: 'hub' } : context
  if (publicContext.kind === 'hub' || publicContext.kind === 'industry') {
    return <ConfiguredFooter context={publicContext} />
  }
  return null
}
