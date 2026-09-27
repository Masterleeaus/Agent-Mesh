import { Link } from 'react-router-dom'

const footerLinks = {
  Product: [
    { label: 'Features', path: '/features' },
    { label: 'Pricing', path: '/pricing' },
    { label: 'Industries', path: '/industries' },
    { label: 'Changelog', path: '/changelog' },
  ],
  Resources: [
    { label: 'FAQ', path: '/faq' },
    { label: 'Help Center', path: '#' },
    { label: 'Status Page', path: '#' },
  ],
  Company: [
    { label: 'About', path: '/about' },
    { label: 'Contact', href: 'mailto:steve@nexjob.app' },
    { label: 'Privacy Policy', path: '#' },
    { label: 'Terms of Service', path: '#' },
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
              NexJob
            </Link>
            <p className="text-sm text-nx-muted mt-3 max-w-[280px] leading-relaxed">
              AI-powered field service management for trade professionals. Schedule, dispatch, invoice, and grow — all from one platform.
            </p>
            <a
              href="mailto:steve@nexjob.app"
              className="inline-block mt-4 text-xs text-nx-muted2 hover:text-nx-text transition-colors"
            >
              steve@nexjob.app
            </a>
            <div className="flex items-center gap-3 mt-4">
              <a href="https://www.facebook.com/profile.php?id=61573228317845" target="_blank" rel="noopener noreferrer" className="text-nx-muted2 hover:text-nx-text transition-colors" aria-label="Facebook">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
              </a>
              <a href="https://www.linkedin.com/company/nex-job/" target="_blank" rel="noopener noreferrer" className="text-nx-muted2 hover:text-nx-text transition-colors" aria-label="LinkedIn">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
              </a>
              <a href="https://www.youtube.com/channel/UCNa9DBZwNx_juKItsKS9hQw" target="_blank" rel="noopener noreferrer" className="text-nx-muted2 hover:text-nx-text transition-colors" aria-label="YouTube">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814z"/><polygon fill="#fff" points="9.545,15.568 15.818,12 9.545,8.432"/></svg>
              </a>
            </div>
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
          <p className="text-xs text-nx-muted2">© 2026 NexJob, LLC — Delaware County, Ohio. All rights reserved.</p>
          <p className="text-xs text-nx-muted2">Made with 🤖 + ☕ for trade pros everywhere</p>
        </div>
      </div>
    </footer>
  )
}
