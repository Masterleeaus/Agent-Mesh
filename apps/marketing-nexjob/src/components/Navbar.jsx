import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { Menu, X, ChevronDown } from 'lucide-react'
import { appRoutes } from '../config'

const industryLinks = [
  ['Cleaning','cleaning'],['Landscaping & Lawn Care','landscaping'],['Pool Service','pools'],['Pressure Washing','pressure-washing'],['Pest Control','pest-control'],['Window Cleaning','window-cleaning'],['Property Maintenance','property-maintenance'],['Mobile Services','mobile-services'],
]

const navLinks = [
  { label: 'Home', path: '/' },
  { label: 'Your Zero', path: '/your-zero' },
  { label: 'Features', path: '/features' },
  { label: 'Fully Managed', path: '/fully-managed' },
  { label: 'Investment', path: '/investment' },
  { label: 'Compare', path: '/compare' },
]

const capabilityLinks = [
  ['AI Workforce','/ai-workforce'],
  ['Intelligence & Decisions','/intelligence-decisions'],
  ['Continuous Evolution','/continuous-evolution'],
  ['Existing Systems & Integrations','/existing-systems'],
  ['Chat, Voice, Camera & Location','/real-world-intelligence'],
  ['Command, Go & Hub','/apps'],
  ['Privacy & Architecture','/privacy-architecture'],
  ['Cost Sovereignty','/cost-sovereignty'],
  ['Security, Evidence & Recovery','/security-recovery'],
  ['Measured Outcomes','/measured-outcomes'],
  ['Environmental Intelligence','/environmental-systems'],
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
          Titan Zero <span className="text-nx-muted font-medium">Field Services</span>
        </Link>

        {/* Desktop Nav */}
        <div className="hidden xl:flex items-center gap-1">
          {navLinks.map(({ label, path }) => (
            <Link
              key={path}
              to={path}
              className={`text-sm font-medium px-3.5 py-2 rounded-lg transition-all ${
                pathname === path || (path === '/industries' && pathname.startsWith('/industries/'))
                  ? 'text-nx-text bg-white/5'
                  : 'text-nx-muted hover:text-nx-text hover:bg-white/5'
              }`}
            >
              {label}
            </Link>
          ))}
          <div className="relative group">
            <Link to="/features" className={`text-sm font-medium px-3.5 py-2 rounded-lg inline-flex items-center gap-1 ${capabilityLinks.some(([,p])=>pathname===p) ? 'text-nx-text bg-white/5' : 'text-nx-muted hover:text-nx-text hover:bg-white/5'}`}>
              Capabilities <ChevronDown size={14}/>
            </Link>
            <div className="absolute right-0 top-full mt-1 w-72 rounded-xl border border-nx-border bg-nx-bg/95 backdrop-blur-xl p-2 shadow-2xl opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto group-focus-within:opacity-100 group-focus-within:pointer-events-auto transition-opacity">
              {capabilityLinks.map(([label,path])=><Link key={path} to={path} className={`block px-3 py-2.5 rounded-lg text-sm ${pathname === path ? 'text-nx-text bg-white/5' : 'text-nx-muted hover:text-nx-text hover:bg-white/5'}`}>{label}</Link>)}
            </div>
          </div>
          <div className="relative group">
            <Link to="/industries" className={`text-sm font-medium px-3.5 py-2 rounded-lg inline-flex items-center gap-1 ${pathname.startsWith('/industries') ? 'text-nx-text bg-white/5' : 'text-nx-muted hover:text-nx-text hover:bg-white/5'}`}>
              Industries <ChevronDown size={14}/>
            </Link>
            <div className="absolute right-0 top-full mt-1 w-64 rounded-xl border border-nx-border bg-nx-bg/95 backdrop-blur-xl p-2 shadow-2xl opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto group-focus-within:opacity-100 group-focus-within:pointer-events-auto transition-opacity">
              {industryLinks.map(([label,slug])=><Link key={slug} to={`/industries/${slug}`} className={`block px-3 py-2.5 rounded-lg text-sm ${pathname === `/industries/${slug}` ? 'text-nx-text bg-white/5' : 'text-nx-muted hover:text-nx-text hover:bg-white/5'}`}>{label}</Link>)}
            </div>
          </div>
        </div>

        {/* CTA — linked to Titan Zero Command */}
        <div className="hidden xl:flex items-center gap-3">
          <a
            href={appRoutes.login}
            className="text-sm font-medium text-nx-muted hover:text-nx-text px-4 py-2 transition-colors"
          >
            Login
          </a>
          <a
            href={appRoutes.signup}
            className="text-sm font-semibold text-white bg-nx-purple hover:bg-nx-purple-dark px-5 py-2 rounded-lg transition-all hover:-translate-y-0.5 hover:shadow-lg hover:shadow-blue-900/30"
          >
            Sign Up
          </a>
        </div>

        {/* Mobile Toggle */}
        <button
          type="button"
          className="xl:hidden text-nx-text"
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label={mobileOpen ? 'Close navigation menu' : 'Open navigation menu'}
          aria-expanded={mobileOpen}
          aria-controls="mobile-navigation"
        >
          {mobileOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Mobile Menu */}
      {mobileOpen && (
        <div id="mobile-navigation" className="xl:hidden border-t border-nx-border bg-nx-bg px-6 pb-4 pt-2">
          {navLinks.map(({ label, path }) => (
            <Link
              key={path}
              to={path}
              onClick={() => setMobileOpen(false)}
              className={`block text-sm font-medium px-3 py-2.5 rounded-lg transition-colors ${
                pathname === path || (path === '/industries' && pathname.startsWith('/industries/')) ? 'text-nx-text bg-white/5' : 'text-nx-muted'
              }`}
            >
              {label}
            </Link>
          ))}
          <div className="mt-3 border-t border-nx-border pt-3">
            <p className="px-3 py-2 text-xs uppercase tracking-widest text-nx-muted2">Capabilities</p>
            {capabilityLinks.map(([label,path])=><Link key={path} to={path} onClick={()=>setMobileOpen(false)} className={`block px-3 py-2 text-sm rounded-lg ${pathname === path ? 'text-nx-text bg-white/5' : 'text-nx-muted'}`}>{label}</Link>)}
          </div>
          <div className="mt-3 border-t border-nx-border pt-3">
            <p className="px-3 py-2 text-xs uppercase tracking-widest text-nx-muted2">Industries</p>
            <Link to="/industries" onClick={()=>setMobileOpen(false)} className={`block px-3 py-2 text-sm rounded-lg ${pathname === '/industries' ? 'text-nx-text bg-white/5' : 'text-nx-muted'}`}>Industries Overview</Link>
            {industryLinks.map(([label,slug])=><Link key={slug} to={`/industries/${slug}`} onClick={()=>setMobileOpen(false)} className={`block px-3 py-2 text-sm rounded-lg ${pathname === `/industries/${slug}` ? 'text-nx-text bg-white/5' : 'text-nx-muted'}`}>{label}</Link>)}
          </div>
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
