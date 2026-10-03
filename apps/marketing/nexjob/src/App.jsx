import { useEffect } from 'react'
import { Routes, Route, Navigate, useLocation, useParams } from 'react-router-dom'
import { APP_ACCESS_AVAILABLE } from './config'
import Navbar from './components/Navbar'
import Footer from './components/Footer'
import Features from './pages/Features'
import About from './pages/About'
import FAQ from './pages/FAQ'
import ManagedSystem from './pages/ManagedSystem'
import CatalogueIndustryHome from './pages/CatalogueIndustryHome'
import ScrollToTop from './components/ScrollToTop'
import PageMeta from './components/PageMeta'
import YourZero from './pages/YourZero'
import Workforce from './pages/Workforce'
import Apps from './pages/Apps'
import PlatformHubHome from './pages/PlatformHubHome'
import WorksEverywhere from './pages/WorksEverywhere'
import { ChromeExtensions, WordPressPlugins } from './pages/ProductFamilyPages'
import PlatformPricing from './pages/PlatformPricing'
import Resources from './pages/Resources'
import { getCurrentSiteContext, getLegacyIndustryRedirect, getVerticalSiteForLegacyPath } from './config/siteContext'

function ExternalRedirect({ href }) {
  useEffect(() => {
    window.location.replace(href)
  }, [href])
  return <main className="pt-32 px-6 text-center text-sm text-nx-muted" role="status">Redirecting to the Cleaning site…</main>
}

function IndustryHostLanding({ site }) {
  return <CatalogueIndustryHome profile={site.profile} />
}

function SiteRoot({ context }) {
  if (context.kind === 'preview') return <PlatformHubHome />
  if (context.kind === 'hub') return <PlatformHubHome />
  if (context.kind === 'industry') return <IndustryHostLanding site={context.site} />
  return <main className="pt-32 pb-24 px-6 text-center"><PageMeta title="Site not found" description="This Titan Zero site host is not configured." /><div className="max-w-3xl mx-auto"><h1 className="text-4xl font-extrabold mb-4">This site is not configured.</h1><p className="text-nx-muted">Only the Titan Zero Cleaning product site is configured for this launch.</p><div className="flex justify-center gap-5 mt-6"><a href="https://titanzero.io/" className="text-sm text-nx-purple-light">Titan Zero Cleaning</a></div></div></main>
}

function LegacyIndustryPath({ context }) {
  const { pathname } = useLocation()
  const target = getLegacyIndustryRedirect(context, pathname)
  if (!target) return <Navigate to="/" replace />
  if (target === '/') return <Navigate to="/" replace />
  return <ExternalRedirect href={target} />
}

function IndustryPath({ context }) {
  const { industry } = useParams()
  if (context.kind !== 'preview') return <LegacyIndustryPath context={context} />
  const site = getVerticalSiteForLegacyPath(industry)
  if (site?.moduleId === 'cleaning') return <IndustryHostLanding site={site} />
  return <Navigate to="/" replace />
}

export default function App() {
  const siteContext = getCurrentSiteContext()
  return (
    <div className="min-h-screen bg-nx-bg text-nx-text">
      <ScrollToTop />
      <Navbar />
      {!APP_ACCESS_AVAILABLE && (
        <div role="status" aria-live="polite" className="fixed top-16 left-0 right-0 z-40 border-b border-amber-300/20 bg-amber-950/95 px-4 py-2 text-center text-xs text-amber-100 sm:text-sm">
          Review build: account access is disabled here. Production buttons use the configured sign-up and sign-in destinations.
        </div>
      )}
      <Routes>
        <Route path="/" element={<SiteRoot context={siteContext} />} />
        <Route path="/titan-zero" element={<YourZero />} />
        <Route path="/your-zero" element={<Navigate to="/titan-zero" replace />} />
        <Route path="/ai-workforce" element={<><PageMeta title="Cleaning AI Workforce" description="Meet the six specialist roles that coordinate cleaning enquiries, sales, bookings, scheduling, job operations and customer care." /><Workforce /></>} />
        <Route path="/apps" element={<Apps />} />
        <Route path="/features" element={<Features />} />
        <Route path="/intelligence-decisions" element={<Navigate to="/features#ai-assist" replace />} />
        <Route path="/continuous-evolution" element={<Navigate to="/features#trust" replace />} />
        <Route path="/existing-systems" element={<Navigate to="/works-everywhere" replace />} />
        <Route path="/real-world-intelligence" element={<Navigate to="/works-everywhere" replace />} />
        <Route path="/security-recovery" element={<Navigate to="/features#trust" replace />} />
        <Route path="/measured-outcomes" element={<Navigate to="/features" replace />} />
        <Route path="/investment" element={<Navigate to="/pricing" replace />} />
        <Route path="/pricing" element={<PlatformPricing />} />
        <Route path="/works-everywhere" element={<WorksEverywhere />} />
        <Route path="/chrome-extensions" element={<ChromeExtensions />} />
        <Route path="/wordpress-plugins" element={<WordPressPlugins />} />
        <Route path="/resources" element={<Resources />} />
        <Route path="/industries" element={<Navigate to="/industries/cleaning" replace />} />
        <Route path="/industries/:industry" element={<IndustryPath context={siteContext} />} />
        <Route path="/fully-managed" element={<><PageMeta title="Managed Service for Cleaning Businesses" description="Implementation and ongoing management for the Cleaning workforce, business system, integrations and workflows." /><ManagedSystem /></>} />
        <Route path="/privacy-architecture" element={<Navigate to="/faq#privacy" replace />} />
        <Route path="/cost-sovereignty" element={<Navigate to="/faq#ai-assist" replace />} />
        <Route path="/environmental-systems" element={<Navigate to="/features#service-range" replace />} />
        <Route path="/compare" element={<Navigate to="/features" replace />} />
        <Route path="/about" element={<About />} />
        <Route path="/faq" element={<FAQ />} />
        <Route path="/changelog" element={<Navigate to="/resources" replace />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <Footer />
    </div>
  )
}
