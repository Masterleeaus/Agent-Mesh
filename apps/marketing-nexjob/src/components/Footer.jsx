import { Link } from 'react-router-dom'

const footerLinks = {
  Product: [
    { label: 'Features', path: '/features' },
    { label: 'Investment', path: '/investment' },
    { label: 'Industries', path: '/industries' },
    { label: 'Fully Managed', path: '/fully-managed' },
    { label: 'Compare', path: '/compare' },
  ],
  Resources: [
    { label: 'FAQ', path: '/faq' },
    { label: 'Privacy & Architecture', path: '/privacy-architecture' },
    { label: 'Cost Sovereignty', path: '/cost-sovereignty' },
    { label: 'Environmental Systems', path: '/environmental-systems' },
  ],
  Company: [
    { label: 'About', path: '/about' },
    { label: 'System Evolution', path: '/changelog' },
  ],
}

export default function Footer() {
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
              Managed Advanced Intelligence workforce and connected operating system for field-service businesses.
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
          <p className="text-xs text-nx-muted2">Managed intelligence for field-service businesses</p>
        </div>
      </div>
    </footer>
  )
}
