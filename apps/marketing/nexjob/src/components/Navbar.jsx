import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { Menu, X, ChevronDown } from 'lucide-react'
import { appRoutes, APP_ACCESS_AVAILABLE, APP_SIGNUP_AVAILABLE } from '../config'
import { getCurrentSiteContext, getSiteNavigation } from '../config/siteContext'

function SiteLink({ item, closeMenu = () => {} }) {
  const href = item.href || ''
  const active = href.startsWith('/') && window.location.pathname === href
  const children = item.children || []
  const className = `block whitespace-nowrap px-3 py-2 rounded-lg text-sm transition-colors ${active ? 'text-nx-text bg-white/5' : 'text-nx-muted hover:text-nx-text hover:bg-white/5'}`
  const parent = item.action && (item.disabled || !href || !APP_ACCESS_AVAILABLE)
    ? <button type="button" disabled aria-disabled="true" aria-label={`${item.label} unavailable`} title="Unavailable in this review preview" className={`${className} opacity-60 cursor-not-allowed`}>{item.label}</button>
    : item.external || href.startsWith('https://')
      ? <a href={href || '#'} onClick={closeMenu} className={className}>{item.label}</a>
      : <Link to={href || '/'} onClick={closeMenu} className={className}>{item.label}{children.length > 0 && <ChevronDown size={14} aria-hidden="true" className="ml-1 inline-block" />}</Link>

  return <div className={children.length > 0 ? 'relative group' : undefined}>
    {parent}
    {children.length > 0 && <>
      <div className="hidden xl:block absolute left-0 top-full mt-1 w-64 rounded-xl border border-nx-border bg-nx-bg/95 backdrop-blur-xl p-2 shadow-2xl opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto group-focus-within:opacity-100 group-focus-within:pointer-events-auto transition-opacity">
        {children.map((child) => <Link key={child.label} to={child.href} onClick={closeMenu} className="block px-3 py-2.5 rounded-lg text-sm text-nx-muted hover:text-nx-text hover:bg-white/5">{child.label}</Link>)}
      </div>
      <div className="xl:hidden ml-5 mt-1 mb-2 border-l border-nx-border pl-2">
        {children.map((child) => <Link key={child.label} to={child.href} onClick={closeMenu} className="block px-3 py-2 rounded-lg text-sm text-nx-muted hover:text-nx-text">{child.label}</Link>)}
      </div>
    </>}
  </div>
}

function ConfiguredNavbar({ context }) {
  const [mobileOpen, setMobileOpen] = useState(false)
  const mobileToggleRef = useRef(null)
  const nav = getSiteNavigation(context)
  const brand = context.kind === 'industry' ? 'Titan Zero Cleaning' : 'Titan Zero'
  const accountActions = context.kind === 'hub'
    ? [
        { label: 'Sign in', href: appRoutes.login, external: true, action: true },
        { label: 'Get started', href: appRoutes.signup, external: true, action: true, disabled: !APP_SIGNUP_AVAILABLE },
      ]
    : [{ label: 'Sign in', href: appRoutes.login, external: true, action: true }]

  useEffect(() => {
    if (!mobileOpen) return undefined
    function handleEscape(event) {
      if (event.key !== 'Escape') return
      event.preventDefault()
      setMobileOpen(false)
      mobileToggleRef.current?.focus()
    }
    window.addEventListener('keydown', handleEscape)
    return () => window.removeEventListener('keydown', handleEscape)
  }, [mobileOpen])

  return <nav aria-label="Primary" className="fixed top-0 left-0 right-0 z-50 glass border-b border-nx-border/60">
    <div className="max-w-7xl mx-auto px-6 flex items-center justify-between h-16 gap-4">
      <Link to="/" aria-label={`${brand} home`} className="flex min-w-0 items-center gap-2 font-extrabold text-lg tracking-tight whitespace-nowrap">
        <span className="w-2 h-2 shrink-0 bg-nx-purple rounded-full" /><span className="min-w-0 truncate">{brand}</span>
      </Link>
      <div className="hidden xl:flex items-center gap-1">
        {nav.map((item) => <SiteLink key={item.label} item={item} />)}
        {accountActions.map((item) => <SiteLink key={item.label} item={item} />)}
      </div>
      <button ref={mobileToggleRef} type="button" className="xl:hidden shrink-0 text-nx-text p-2 -mr-2 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-nx-purple" onClick={() => setMobileOpen(!mobileOpen)} aria-label={mobileOpen ? 'Close navigation menu' : 'Open navigation menu'} aria-expanded={mobileOpen} aria-controls="site-mobile-navigation">
        {mobileOpen ? <X size={24} /> : <Menu size={24} />}
      </button>
    </div>
    {mobileOpen && <div id="site-mobile-navigation" role="region" aria-label="Mobile navigation" className="xl:hidden border-t border-nx-border bg-nx-bg px-4 pb-4 pt-2 max-h-[calc(100vh-4rem)] overflow-y-auto">
      {nav.map((item) => <SiteLink key={item.label} item={item} closeMenu={() => setMobileOpen(false)} />)}
      <div className="mt-3 border-t border-nx-border pt-3">
        {accountActions.map((item) => <SiteLink key={item.label} item={item} closeMenu={() => setMobileOpen(false)} />)}
      </div>
      {context.kind !== 'hub' && <a href="https://titanzero.io/" onClick={() => setMobileOpen(false)} className="block px-3 py-2 rounded-lg text-sm text-nx-muted">Titan Zero platform</a>}
    </div>}
  </nav>
}

export default function Navbar() {
  const context = getCurrentSiteContext()
  const publicContext = context.kind === 'preview' ? { ...context, kind: 'hub' } : context
  if (publicContext.kind === 'hub' || publicContext.kind === 'industry') return <ConfiguredNavbar context={publicContext} />
  return null
}
