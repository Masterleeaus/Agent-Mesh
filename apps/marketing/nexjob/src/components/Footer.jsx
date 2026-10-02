import { Link } from 'react-router-dom'
import { getCurrentSiteContext } from '../config/siteContext'

const hubColumns = {
  Product: [
    ['How it works', '/#how-it-works'],
    ['Cleaning SaaS', '/industries/cleaning'],
    ['Features', '/features'],
    ['AI workforce', '/ai-workforce'],
    ['Works Everywhere', '/works-everywhere'],
    ['Pricing', '/pricing'],
    ['Managed service', '/fully-managed'],
  ],
  Resources: [
    ['Privacy & architecture', '/privacy-architecture'],
    ['Cost sovereignty', '/cost-sovereignty'],
    ['Security & recovery', '/security-recovery'],
    ['Resources', '/resources'],
  ],
  Company: [
    ['About', '/about'],
    ['System evolution', '/changelog'],
  ],
}

const cleaningColumns = {
  Cleaning: [
    ['Overview', '/'],
    ['Workflows', '/#workflows'],
    ['Features', '/#features'],
    ['Works Everywhere', '/works-everywhere'],
    ['Pricing', '/pricing'],
    ['Managed service', '/fully-managed'],
  ],
  Platform: [
    ['Titan Zero platform', 'https://titanzero.io/'],
  ],
}

function FooterLink({ label, href }) {
  const className = 'text-sm text-nx-muted2 hover:text-nx-text transition-colors'
  return href.startsWith('https://')
    ? <a href={href} className={className}>{label}</a>
    : <Link to={href} className={className}>{label}</Link>
}

function ConfiguredFooter({ context }) {
  const columns = context.kind === 'industry' ? cleaningColumns : hubColumns
  const brand = context.kind === 'industry' ? 'Titan Zero Cleaning' : 'Titan Zero'
  const description = context.kind === 'industry'
    ? 'Cleaning service workflows, product capabilities and work-surface release states.'
    : 'Cleaning-first SaaS, the managed-service offer and evidence-based product information.'

  return <footer className="border-t border-nx-border mt-16">
    <div className="max-w-7xl mx-auto px-6 pt-16 pb-8">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 mb-12">
        <div>
          <Link to="/" className="flex items-center gap-2 font-extrabold text-lg"><span className="w-2 h-2 bg-nx-purple rounded-full" />{brand}</Link>
          <p className="text-sm text-nx-muted mt-3 max-w-[280px] leading-relaxed">{description}</p>
          <a href="mailto:support@titanzero.io" className="inline-block mt-4 text-xs text-nx-muted2 hover:text-nx-text transition-colors">support@titanzero.io</a>
        </div>
        {Object.entries(columns).map(([heading, links]) => <div key={heading}>
          <h2 className="text-xs font-semibold text-nx-muted uppercase tracking-wider mb-4">{heading}</h2>
          <ul className="space-y-2">{links.map(([label, href]) => <li key={label}><FooterLink label={label} href={href} /></li>)}</ul>
        </div>)}
      </div>
      <div className="border-t border-nx-border pt-6 flex flex-col sm:flex-row justify-between items-center gap-2">
        <p className="text-xs text-nx-muted2">© 2026 Titan Zero. All rights reserved.</p>
        <p className="text-xs text-nx-muted2">Cleaning first. People, systems and AI working together.</p>
      </div>
    </div>
  </footer>
}

export default function Footer() {
  const context = getCurrentSiteContext()
  const publicContext = context.kind === 'preview' ? { ...context, kind: 'hub' } : context
  if (publicContext.kind === 'hub' || publicContext.kind === 'industry') return <ConfiguredFooter context={publicContext} />
  return null
}
