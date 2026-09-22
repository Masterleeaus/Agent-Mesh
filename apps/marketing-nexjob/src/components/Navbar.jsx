import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { Menu, X } from 'lucide-react'
import { appRoutes } from '../config'

const navLinks = [
  { label: 'Home', path: '/' },
  { label: 'Features', path: '/features' },
  { label: 'Fully Managed', path: '/fully-managed' },
  { label: 'Investment', path: '/investment' },
  { label: 'Industries', path: '/industries' },
  { label: 'Privacy', path: '/privacy-architecture' },
  { label: 'Costs', path: '/cost-sovereignty' },
  { label: 'Environment', path: '/environmental-systems' },
  { label: 'Compare', path: '/compare' },
  { label: 'About', path: '/about' },
]

export default function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false)
  const { pathname } = useLocation()

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 glass border-b border-nx-border/60">
      <div className="max-w-7xl mx-auto px-6 flex items-center justify-between h-16">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2 font-extrabold text-xl tracking-tight">
          <span className="w-2 h-2 bg-nx-purple rounded-full animate-pulse-dot" />
          Titan Zero <span className="text-nx-muted font-medium">Field Service</span>
        </Link>

        {/* Desktop Nav */}
        <div className="hidden md:flex items-center gap-1">
          {navLinks.map(({ label, path }) => (
            <Link
              key={path}
              to={path}
              className={`text-sm font-medium px-3.5 py-2 rounded-lg transition-all ${
                pathname === path
                  ? 'text-nx-text bg-white/5'
                  : 'text-nx-muted hover:text-nx-text hover:bg-white/5'
              }`}
            >
              {label}
            </Link>
          ))}
        </div>

        {/* CTA — linked to Titan Zero Command */}
        <div className="hidden md:flex items-center gap-3">
          <a
            href={appRoutes.login}
            className="text-sm font-medium text-nx-muted hover:text-nx-text px-4 py-2 transition-colors"
          >
            Login
          </a>
          <a
            href={appRoutes.signup}
            className="text-sm font-semibold text-white bg-nx-purple hover:bg-nx-purple-dark px-5 py-2 rounded-lg transition-all hover:-translate-y-0.5 hover:shadow-lg hover:shadow-purple-500/30"
          >
            Sign Up
          </a>
        </div>

        {/* Mobile Toggle */}
        <button
          className="md:hidden text-nx-text"
          onClick={() => setMobileOpen(!mobileOpen)}
        >
          {mobileOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Mobile Menu */}
      {mobileOpen && (
        <div className="md:hidden border-t border-nx-border bg-nx-bg px-6 pb-4 pt-2">
          {navLinks.map(({ label, path }) => (
            <Link
              key={path}
              to={path}
              onClick={() => setMobileOpen(false)}
              className={`block text-sm font-medium px-3 py-2.5 rounded-lg transition-colors ${
                pathname === path ? 'text-nx-text bg-white/5' : 'text-nx-muted'
              }`}
            >
              {label}
            </Link>
          ))}
          <div className="mt-3 flex flex-col gap-2">
            <a href={appRoutes.login} className="text-sm font-medium text-nx-muted py-2 text-center">
              Log In
            </a>
            <a href={appRoutes.signup} className="text-sm font-semibold text-white bg-nx-purple py-2.5 rounded-lg text-center">
              Sign Up
            </a>
          </div>
        </div>
      )}
    </nav>
  )
}
