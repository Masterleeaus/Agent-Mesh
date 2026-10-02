import { useEffect, useRef, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { Menu, X, ChevronDown } from 'lucide-react'
import { appRoutes, APP_ACCESS_AVAILABLE, APP_SIGNUP_AVAILABLE } from '../config'
import { getCurrentSiteContext, getIndustryDirectoryLinks, getSiteNavigation } from '../config/siteContext'

const industryLinks = [
  ['Cleaning','cleaning'],['Landscaping & Lawn Care','landscaping'],['Pool Service','pools'],['Pressure Washing','pressure-washing'],['Pest Control','pest-control'],['Window Cleaning','window-cleaning'],['Property Maintenance','property-maintenance'],['Mobile Services','mobile-services'],
  ['Handyman Services','handyman'],['Plumbing','plumbing'],['Electrical','electrical'],['HVAC & Air Conditioning','hvac'],['Construction','construction'],['Roofing','roofing'],['Tiling','tiling'],['Concreting','concreting'],['Painting','painting'],['Plastering','plastering'],['Renovations','renovations'],
]

const navLinks = [
  { label: 'Home', path: '/' },
  { label: 'Your Zero', path: '/your-zero' },
  { label: 'Investment', path: '/investment' },
]

const howLinks = [
  ['Fully Managed','/fully-managed'],
  ['Existing Systems & Integrations','/existing-systems'],
  ['Continuous Evolution','/continuous-evolution'],
]

const capabilityLinks = [
  ['AI Workforce','/ai-workforce'],
  ['Intelligence & Decisions','/intelligence-decisions'],
  ['Chat, Voice, Camera & Location','/real-world-intelligence'],
  ['Command, Go & Hub','/apps'],
  ['Privacy & Architecture','/privacy-architecture'],
  ['Cost Sovereignty','/cost-sovereignty'],
  ['Security, Evidence & Recovery','/security-recovery'],
  ['Measured Outcomes','/measured-outcomes'],
  ['Environmental Intelligence','/environmental-systems'],
]

const whyLinks = [
  ['Compare','/compare'],
  ['Privacy & Architecture','/privacy-architecture'],
  ['Cost Sovereignty','/cost-sovereignty'],
  ['Security, Evidence & Recovery','/security-recovery'],
  ['About','/about'],
  ['FAQ','/faq'],
]

function LegacyNavbar() {
  const [mobileOpen, setMobileOpen] = useState(false)
  const { pathname } = useLocation()

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 glass border-b border-nx-border/60">
      <div className="max-w-7xl mx-auto px-6 flex items-center justify-between h-16">
        {/* Logo */}
        <Link to="/" aria-label="Titan Zero Field Services home" className="flex items-center gap-2 font-extrabold text-lg tracking-tight whitespace-nowrap">
          <span className="w-2 h-2 bg-nx-purple rounded-full animate-pulse-dot" />
          Titan Zero <span className="text-nx-muted font-medium">Field Services</span>
        </Link>

        {/* Desktop Nav */}
        <div className="hidden xl:flex items-center gap-1">
          {navLinks.map(({ label, path }) => (
            <Link
              key={path}
              to={path}
              className={`text-xs font-medium whitespace-nowrap px-2 py-2 rounded-lg transition-all ${
                pathname === path || (path === '/industries' && pathname.startsWith('/industries/'))
                  ? 'text-nx-text bg-white/5'
                  : 'text-nx-muted hover:text-nx-text hover:bg-white/5'
              }`}
            >
              {label}
            </Link>
          ))}
          <div className="relative group">
            <Link to="/fully-managed" className={`text-xs font-medium whitespace-nowrap px-2 py-2 rounded-lg inline-flex items-center gap-1 ${howLinks.some(([,p])=>pathname===p) ? 'text-nx-text bg-white/5' : 'text-nx-muted hover:text-nx-text hover:bg-white/5'}`}>
              How Titan Works <ChevronDown size={14}/>
            </Link>
            <div className="absolute right-0 top-full mt-1 w-72 rounded-xl border border-nx-border bg-nx-bg/95 backdrop-blur-xl p-2 shadow-2xl opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto group-focus-within:opacity-100 group-focus-within:pointer-events-auto transition-opacity">
              {howLinks.map(([label,path])=><Link key={path} to={path} className={`block px-3 py-2.5 rounded-lg text-sm ${pathname === path ? 'text-nx-text bg-white/5' : 'text-nx-muted hover:text-nx-text hover:bg-white/5'}`}>{label}</Link>)}
            </div>
          </div>
          <div className="relative group">
            <Link to="/features" className={`text-xs font-medium whitespace-nowrap px-2 py-2 rounded-lg inline-flex items-center gap-1 ${capabilityLinks.some(([,p])=>pathname===p) ? 'text-nx-text bg-white/5' : 'text-nx-muted hover:text-nx-text hover:bg-white/5'}`}>
              Capabilities <ChevronDown size={14}/>
            </Link>
            <div className="absolute right-0 top-full mt-1 w-72 rounded-xl border border-nx-border bg-nx-bg/95 backdrop-blur-xl p-2 shadow-2xl opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto group-focus-within:opacity-100 group-focus-within:pointer-events-auto transition-opacity">
              <Link to="/features" className={`block px-3 py-2.5 rounded-lg text-sm font-semibold ${pathname === '/features' ? 'text-nx-text bg-white/5' : 'text-nx-muted hover:text-nx-text hover:bg-white/5'}`}>All Capabilities</Link>
              {capabilityLinks.map(([label,path])=><Link key={path} to={path} className={`block px-3 py-2.5 rounded-lg text-sm ${pathname === path ? 'text-nx-text bg-white/5' : 'text-nx-muted hover:text-nx-text hover:bg-white/5'}`}>{label}</Link>)}
            </div>
          </div>
          <div className="relative group">
            <Link to="/industries" className={`text-xs font-medium whitespace-nowrap px-2 py-2 rounded-lg inline-flex items-center gap-1 ${pathname.startsWith('/industries') ? 'text-nx-text bg-white/5' : 'text-nx-muted hover:text-nx-text hover:bg-white/5'}`}>
              Industries <ChevronDown size={14}/>
            </Link>
            <div className="absolute right-0 top-full mt-1 w-64 max-h-[calc(100vh-5rem)] overflow-y-auto rounded-xl border border-nx-border bg-nx-bg/95 backdrop-blur-xl p-2 shadow-2xl opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto group-focus-within:opacity-100 group-focus-within:pointer-events-auto transition-opacity">
              {industryLinks.map(([label,slug])=><Link key={slug} to={`/industries/${slug}`} className={`block px-3 py-2.5 rounded-lg text-sm ${pathname === `/industries/${slug}` ? 'text-nx-text bg-white/5' : 'text-nx-muted hover:text-nx-text hover:bg-white/5'}`}>{label}</Link>)}
            </div>
          </div>
          <div className="relative group">
            <Link to="/compare" className={`text-xs font-medium whitespace-nowrap px-2 py-2 rounded-lg inline-flex items-center gap-1 ${whyLinks.some(([,p])=>pathname===p) ? 'text-nx-text bg-white/5' : 'text-nx-muted hover:text-nx-text hover:bg-white/5'}`}>
              Why Titan Zero <ChevronDown size={14}/>
            </Link>
            <div className="absolute right-0 top-full mt-1 w-72 rounded-xl border border-nx-border bg-nx-bg/95 backdrop-blur-xl p-2 shadow-2xl opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto group-focus-within:opacity-100 group-focus-within:pointer-events-auto transition-opacity">
              {whyLinks.map(([label,path])=><Link key={path} to={path} className={`block px-3 py-2.5 rounded-lg text-sm ${pathname === path ? 'text-nx-text bg-white/5' : 'text-nx-muted hover:text-nx-text hover:bg-white/5'}`}>{label}</Link>)}
            </div>
          </div>
        </div>

        {/* Account actions stay visibly unavailable in the review preview. */}
        <div className="hidden xl:flex items-center gap-3">
          {APP_ACCESS_AVAILABLE ? (
            <>
              <a href={appRoutes.login} className="text-sm font-medium text-nx-muted hover:text-nx-text px-4 py-2 transition-colors">Login</a>
              {APP_SIGNUP_AVAILABLE ? <a href={appRoutes.signup} className="text-sm font-semibold text-white bg-nx-purple hover:bg-nx-purple-dark px-5 py-2 rounded-lg transition-all hover:-translate-y-0.5 hover:shadow-lg hover:shadow-blue-900/30">Sign Up</a> : <button type="button" disabled aria-disabled="true" className="text-sm font-semibold text-white bg-nx-purple px-5 py-2 rounded-lg opacity-60 cursor-not-allowed">Sign-up unavailable</button>}
            </>
          ) : (
            <>
              <button type="button" disabled aria-disabled="true" className="text-sm font-medium text-nx-muted hover:text-nx-text px-4 py-2 opacity-60 cursor-not-allowed">Login</button>
              <button type="button" disabled aria-disabled="true" className="text-sm font-semibold text-white bg-nx-purple px-5 py-2 rounded-lg opacity-60 cursor-not-allowed">Sign-up unavailable</button>
            </>
          )}
        </div>

        {/* Mobile Toggle */}
        <button
          type="button"
          className="xl:hidden text-nx-text p-2 -mr-2 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-nx-purple"
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
        <div id="mobile-navigation" aria-label="Mobile navigation" className="xl:hidden border-t border-nx-border bg-nx-bg px-6 pb-4 pt-2 max-h-[calc(100vh-4rem)] overflow-y-auto">
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
            <p className="px-3 py-2 text-xs uppercase tracking-widest text-nx-muted2">How Titan Works</p>
            {howLinks.map(([label,path])=><Link key={path} to={path} onClick={()=>setMobileOpen(false)} className={`block px-3 py-2 text-sm rounded-lg ${pathname === path ? 'text-nx-text bg-white/5' : 'text-nx-muted'}`}>{label}</Link>)}
          </div>
          <div className="mt-3 border-t border-nx-border pt-3">
            <p className="px-3 py-2 text-xs uppercase tracking-widest text-nx-muted2">Capabilities</p>
            <Link to="/features" onClick={()=>setMobileOpen(false)} className={`block px-3 py-2 text-sm font-semibold rounded-lg ${pathname === '/features' ? 'text-nx-text bg-white/5' : 'text-nx-muted'}`}>All Capabilities</Link>
            {capabilityLinks.map(([label,path])=><Link key={path} to={path} onClick={()=>setMobileOpen(false)} className={`block px-3 py-2 text-sm rounded-lg ${pathname === path ? 'text-nx-text bg-white/5' : 'text-nx-muted'}`}>{label}</Link>)}
          </div>
          <div className="mt-3 border-t border-nx-border pt-3">
            <p className="px-3 py-2 text-xs uppercase tracking-widest text-nx-muted2">Industries</p>
            <Link to="/industries" onClick={()=>setMobileOpen(false)} className={`block px-3 py-2 text-sm rounded-lg ${pathname === '/industries' ? 'text-nx-text bg-white/5' : 'text-nx-muted'}`}>Industries Overview</Link>
            {industryLinks.map(([label,slug])=><Link key={slug} to={`/industries/${slug}`} onClick={()=>setMobileOpen(false)} className={`block px-3 py-2 text-sm rounded-lg ${pathname === `/industries/${slug}` ? 'text-nx-text bg-white/5' : 'text-nx-muted'}`}>{label}</Link>)}
          </div>
          <div className="mt-3 border-t border-nx-border pt-3">
            <p className="px-3 py-2 text-xs uppercase tracking-widest text-nx-muted2">Why Titan Zero</p>
            {whyLinks.map(([label,path])=><Link key={path} to={path} onClick={()=>setMobileOpen(false)} className={`block px-3 py-2 text-sm rounded-lg ${pathname === path ? 'text-nx-text bg-white/5' : 'text-nx-muted'}`}>{label}</Link>)}
          </div>
          <div className="mt-3 flex flex-col gap-2">
            {APP_ACCESS_AVAILABLE ? (
              <>
                <a href={appRoutes.login} className="text-sm font-medium text-nx-muted py-2 text-center">Log In</a>
                {APP_SIGNUP_AVAILABLE ? <a href={appRoutes.signup} className="text-sm font-semibold text-white bg-nx-purple py-2.5 rounded-lg text-center">Sign Up</a> : <button type="button" disabled aria-disabled="true" className="text-sm font-semibold text-white bg-nx-purple py-2.5 rounded-lg text-center opacity-60 cursor-not-allowed">Sign-up unavailable</button>}
              </>
            ) : (
              <>
                <button type="button" disabled aria-disabled="true" className="text-sm font-medium text-nx-muted py-2 text-center opacity-60 cursor-not-allowed">Log In</button>
                <button type="button" disabled aria-disabled="true" className="text-sm font-semibold text-white bg-nx-purple py-2.5 rounded-lg text-center opacity-60 cursor-not-allowed">Sign Up</button>
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  )
}

function SiteLink({ item, closeMenu = () => {} }) {
  const href = item.href || ''
  const active = href.startsWith('/') && window.location.pathname === href
  const className = `block whitespace-nowrap px-3 py-2 rounded-lg text-sm transition-colors ${active ? 'text-nx-text bg-white/5' : 'text-nx-muted hover:text-nx-text hover:bg-white/5'}`
  const childLinks = item.children || []
  const parent = item.action && (item.disabled || !href || !APP_ACCESS_AVAILABLE)
    ? <button type="button" disabled aria-disabled="true" aria-label={`${item.label} unavailable`} title="Unavailable in this review preview" className={`${className} opacity-60 cursor-not-allowed`}>{item.label}</button>
    : item.external || href.startsWith('https://')
      ? <a href={href || '#'} onClick={closeMenu} className={className}>{item.label}</a>
      : <Link to={href || '/'} onClick={closeMenu} className={className}>{item.label}{childLinks.length > 0 && <ChevronDown size={14} aria-hidden="true" className="ml-1 inline-block" />}</Link>

  return <div className={childLinks.length > 0 ? 'relative group' : undefined}>
    {parent}
    {childLinks.length > 0 && <>
      <div className="hidden xl:block absolute left-0 top-full mt-1 w-64 rounded-xl border border-nx-border bg-nx-bg/95 backdrop-blur-xl p-2 shadow-2xl opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto group-focus-within:opacity-100 group-focus-within:pointer-events-auto transition-opacity">
        {childLinks.map((child) => <Link key={child.label} to={child.href} onClick={closeMenu} className="block px-3 py-2.5 rounded-lg text-sm text-nx-muted hover:text-nx-text hover:bg-white/5">{child.label}</Link>)}
      </div>
      <div className="xl:hidden ml-5 mt-1 mb-2 border-l border-nx-border pl-2">
        {childLinks.map((child) => <Link key={child.label} to={child.href} onClick={closeMenu} className="block px-3 py-2 rounded-lg text-sm text-nx-muted hover:text-nx-text">{child.label}</Link>)}
      </div>
    </>}
  </div>
}

function ConfiguredNavbar({ context }) {
  const [mobileOpen, setMobileOpen] = useState(false)
  const [industriesOpen, setIndustriesOpen] = useState(false)
  const mobileToggleRef = useRef(null)
  const industriesToggleRef = useRef(null)
  const nav = getSiteNavigation(context)
  const industries = context.kind === 'industry' ? getIndustryDirectoryLinks() : []
  const brand = context.kind === 'industry'
    ? `Titan Zero ${context.site.name}`
    : 'Titan Zero'

  const accountActions = context.kind === 'hub'
    ? [{ label: 'Sign in', href: appRoutes.login, external: true, action: true }, { label: 'Get started', href: appRoutes.signup, external: true, action: true, disabled: !APP_SIGNUP_AVAILABLE }]
    : [{ label: 'Sign in', href: appRoutes.login, external: true, action: true }]

  useEffect(() => {
    if (!mobileOpen && !industriesOpen) return undefined

    function handleEscape(event) {
      if (event.key !== 'Escape') return
      event.preventDefault()

      if (mobileOpen) {
        setMobileOpen(false)
        mobileToggleRef.current?.focus()
        return
      }

      setIndustriesOpen(false)
      industriesToggleRef.current?.focus()
    }

    window.addEventListener('keydown', handleEscape)
    return () => window.removeEventListener('keydown', handleEscape)
  }, [mobileOpen, industriesOpen])

  return (
    <nav aria-label="Primary" className="fixed top-0 left-0 right-0 z-50 glass border-b border-nx-border/60">
      <div className="max-w-7xl mx-auto px-6 flex items-center justify-between h-16 gap-4">
        <Link to="/" aria-label={`${brand} home`} className="flex min-w-0 items-center gap-2 font-extrabold text-lg tracking-tight whitespace-nowrap">
          <span className="w-2 h-2 shrink-0 bg-nx-purple rounded-full" /><span className="min-w-0 truncate">{brand}</span>
        </Link>
        <div className="hidden xl:flex items-center gap-1">
          {nav.map((item) => <SiteLink key={item.label} item={item} />)}
          {context.kind !== 'hub' && <a href="https://titanzero.io/" className="block whitespace-nowrap px-3 py-2 rounded-lg text-sm text-nx-muted hover:text-nx-text hover:bg-white/5">Platform</a>}
          {industries.length > 0 && <div
            className="relative"
            onMouseEnter={() => setIndustriesOpen(true)}
            onMouseLeave={(event) => {
              if (!event.currentTarget.contains(document.activeElement)) setIndustriesOpen(false)
            }}
            onBlur={(event) => {
              if (!event.currentTarget.contains(event.relatedTarget)) setIndustriesOpen(false)
            }}
          >
            <button
              ref={industriesToggleRef}
              type="button"
              aria-expanded={industriesOpen}
              aria-controls="site-desktop-industries-menu"
              onClick={(event) => setIndustriesOpen((open) => event.detail > 0 ? true : !open)}
              className="text-sm text-nx-muted hover:text-nx-text px-3 py-2 inline-flex items-center gap-1"
            >Other industries <ChevronDown size={14} aria-hidden="true" /></button>
            <div id="site-desktop-industries-menu" role="group" aria-label="Other industries" aria-hidden={!industriesOpen} className={`absolute right-0 top-full mt-1 w-72 max-h-[calc(100vh-5rem)] overflow-y-auto rounded-xl border border-nx-border bg-nx-bg/95 backdrop-blur-xl p-2 shadow-2xl transition-opacity ${industriesOpen ? 'opacity-100' : 'invisible opacity-0 pointer-events-none'}`}>
              {industries.filter(({ host }) => host !== context.site.host).map((item) => <a key={item.host} href={item.href} className="block px-3 py-2.5 rounded-lg text-sm text-nx-muted hover:text-nx-text hover:bg-white/5">{item.label}</a>)}
              <a href="https://titanzero.io/industries" className="block px-3 py-2.5 rounded-lg text-sm font-semibold text-nx-purple-light hover:bg-white/5">All industries</a>
            </div>
          </div>}
          {accountActions.map((item) => <SiteLink key={item.label} item={item} />)}
        </div>
        <button ref={mobileToggleRef} type="button" className="xl:hidden shrink-0 text-nx-text p-2 -mr-2 rounded-lg" onClick={() => setMobileOpen(!mobileOpen)} aria-label={mobileOpen ? 'Close navigation menu' : 'Open navigation menu'} aria-expanded={mobileOpen} aria-controls="site-mobile-navigation">
          {mobileOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>
      {mobileOpen && <div id="site-mobile-navigation" role="region" aria-label="Mobile navigation" className="xl:hidden border-t border-nx-border bg-nx-bg px-4 pb-4 pt-2 max-h-[calc(100vh-4rem)] overflow-y-auto">
        {nav.map((item) => <SiteLink key={item.label} item={item} closeMenu={() => setMobileOpen(false)} />)}
        {industries.length > 0 && <div className="mt-3 border-t border-nx-border pt-3">
          <p className="px-3 py-2 text-xs uppercase tracking-widest text-nx-muted2">Other industries</p>
          {industries.filter(({ host }) => host !== context.site.host).map((item) => <a key={item.host} href={item.href} onClick={() => setMobileOpen(false)} className="block px-3 py-2 rounded-lg text-sm text-nx-muted">{item.label}</a>)}
          <a href="https://titanzero.io/industries" onClick={() => setMobileOpen(false)} className="block px-3 py-2 rounded-lg text-sm font-semibold text-nx-purple-light">All industries</a>
        </div>}
        <div className="mt-3 border-t border-nx-border pt-3">
          {accountActions.map((item) => <SiteLink key={item.label} item={item} closeMenu={() => setMobileOpen(false)} />)}
        </div>
        {context.kind !== 'hub' && <a href="https://titanzero.io/" onClick={() => setMobileOpen(false)} className="block px-3 py-2 rounded-lg text-sm text-nx-muted">Titan Zero platform</a>}
      </div>}
    </nav>
  )
}

export default function Navbar() {
  const context = getCurrentSiteContext()
  const publicContext = context.kind === 'preview' ? { ...context, kind: 'hub' } : context
  if (publicContext.kind === 'hub' || publicContext.kind === 'industry') {
    return <ConfiguredNavbar context={publicContext} />
  }
  return null
}
