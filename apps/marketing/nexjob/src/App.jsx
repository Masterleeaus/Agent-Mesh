import { useEffect } from 'react'
import { Routes, Route, Navigate, useLocation, useParams } from 'react-router-dom'
import { APP_ACCESS_AVAILABLE } from './config'
import Navbar from './components/Navbar'
import Footer from './components/Footer'
import Home from './pages/Home'
import Features from './pages/Features'
import Pricing from './pages/Pricing'
import Industries from './pages/Industries'
import About from './pages/About'
import FAQ from './pages/FAQ'
import Changelog from './pages/Changelog'
import ManagedSystem from './pages/ManagedSystem'
import Architecture from './pages/Architecture'
import CostSovereignty from './pages/CostSovereignty'
import EnvironmentalSystems from './pages/EnvironmentalSystems'
import Compare from './pages/Compare'
import IndustryHome, { industryConfigs } from './pages/IndustryHome'
import CatalogueIndustryHome from './pages/CatalogueIndustryHome'
import ScrollToTop from './components/ScrollToTop'
import PageMeta from './components/PageMeta'
import YourZero from './pages/YourZero'
import Workforce from './pages/Workforce'
import IntelligenceDecisions from './pages/IntelligenceDecisions'
import ContinuousEvolution from './pages/ContinuousEvolution'
import ExistingSystems from './pages/ExistingSystems'
import RealWorldIntelligence from './pages/RealWorldIntelligence'
import Apps from './pages/Apps'
import SecurityRecovery from './pages/SecurityRecovery'
import MeasuredOutcomes from './pages/MeasuredOutcomes'
import PlatformHubHome from './pages/PlatformHubHome'
import WorksEverywhere from './pages/WorksEverywhere'
import PlatformPricing from './pages/PlatformPricing'
import Resources from './pages/Resources'
import { getCurrentSiteContext, getLegacyIndustryRedirect, getVerticalSiteForLegacyPath } from './config/siteContext'

function ExternalRedirect({ href }) {
  useEffect(() => {
    window.location.replace(href)
  }, [href])
  return <main className="pt-32 px-6 text-center text-sm text-nx-muted" role="status">Redirecting to the canonical Titan Zero site…</main>
}

function IndustryHostLanding({ site }) {
  return <CatalogueIndustryHome profile={site.profile} />
}

function SiteRoot({ context }) {
  if (context.kind === 'preview') return <><PageMeta /><Home /></>
  if (context.kind === 'hub') return <PlatformHubHome />
  if (context.kind === 'industry') return <IndustryHostLanding site={context.site} />
  return <main className="pt-32 pb-24 px-6 text-center"><PageMeta title="Site not found" description="This Titan Zero site host is not configured." /><div className="max-w-3xl mx-auto"><h1 className="text-4xl font-extrabold mb-4">This site is not configured.</h1><p className="text-nx-muted">Use the Titan Zero platform or managed-services site.</p><div className="flex justify-center gap-5 mt-6"><a href="https://titanzero.io/" className="text-sm text-nx-purple-light">Titan Zero platform</a><a href="https://titanzero.pro/" className="text-sm text-nx-purple-light">Titan Zero Managed Services</a></div></div></main>
}

function LegacyIndustryPath({ context }) {
  const { pathname } = useLocation()
  const target = getLegacyIndustryRedirect(context, pathname)
  if (!target) return <Navigate to="/industries" replace />
  if (target === '/') return <Navigate to="/" replace />
  return <ExternalRedirect href={target} />
}

function IndustryPath({ context }) {
  const { industry } = useParams()
  if (context.kind !== 'preview') return <LegacyIndustryPath context={context} />
  if (industryConfigs[industry]) return <IndustryHome />
  const site = getVerticalSiteForLegacyPath(industry)
  if (site) return <IndustryHostLanding site={site} />
  return <Navigate to="/industries" replace />
}

export default function App() {
  const siteContext = getCurrentSiteContext()
  return (
    <div className="min-h-screen bg-nx-bg text-nx-text">
      <ScrollToTop />
      <Navbar />
      {!APP_ACCESS_AVAILABLE && (
        <div role="status" aria-live="polite" className="fixed top-16 left-0 right-0 z-40 border-b border-amber-300/20 bg-amber-950/95 px-4 py-2 text-center text-xs text-amber-100 sm:text-sm">
          Review preview only. Workflow examples do not confirm installed services. Login and sign-up are disabled in this preview.
        </div>
      )}
      <Routes>
        <Route path="/" element={<SiteRoot context={siteContext} />} />
        <Route path="/your-zero" element={<><PageMeta title="Your Zero" description="Meet Your Zero: your personal digital working intelligence that learns you, your role and authorised context while coordinating specialist capabilities under governed human authority." /><YourZero /></>} />
        <Route path="/ai-workforce" element={<><PageMeta title="AI Workforce" description="See how each person's Zero can coordinate appropriate specialist AI workforce capabilities across customer service, operations, finance and field-service work." /><Workforce /></>} />
        <Route path="/intelligence-decisions" element={<><PageMeta title="Intelligence & Decisions" description="Explore Titan Zero evidence, uncertainty, investigation, multiple reasoning perspectives and governed decision support." /><IntelligenceDecisions /></>} />
        <Route path="/continuous-evolution" element={<><PageMeta title="Continuous Evolution" description="See how personal Zeros and the connected business system can learn from meaningful change and evolve without confusing learning with authority." /><ContinuousEvolution /></>} />
        <Route path="/existing-systems" element={<><PageMeta title="Existing Systems & Integrations" description="Keep the business software that works, connect it through Titan Zero and fill genuine software gaps where required." /><ExistingSystems /></>} />
        <Route path="/real-world-intelligence" element={<><PageMeta title="Chat, Voice, Camera & Location" description="Use chat, voice, camera, visual evidence, maps and communications to bring Titan Zero intelligence closer to real-world work." /><RealWorldIntelligence /></>} />
        <Route path="/apps" element={<><PageMeta title="Command, Go & Hub" description="Explore Command for owner and manager Zeros, Go for staff and field Zeros, and Hub for customer Zeros in one governed business environment." /><Apps /></>} />
        <Route path="/security-recovery" element={<><PageMeta title="Security, Evidence & Recovery" description="Explore Titan Zero Shield, evidence provenance, protected intelligence and Rewind recovery principles." /><SecurityRecovery /></>} />
        <Route path="/measured-outcomes" element={<><PageMeta title="Measured Outcomes" description="Measure personal experience and shared business outcomes without collapsing them into one memory, so Titan Zero can learn from real results." /><MeasuredOutcomes /></>} />
        <Route path="/features" element={<><PageMeta title="Capabilities" description="Explore personal Zeros, managed workforce, field operations, integration, private intelligence and software gap-filling capabilities of Titan Zero Field Services." /><Features /></>} />
        <Route path="/investment" element={siteContext.kind === 'preview' ? <><PageMeta title="Investment" description="Illustrative Titan Zero Field Services investment examples and the launch offer for managed implementation and ongoing system management." /><Pricing /></> : <Navigate to="/pricing" replace />} />
        <Route path="/pricing" element={siteContext.kind === 'preview' ? <Navigate to="/investment" replace /> : <PlatformPricing />} />
        <Route path="/works-everywhere" element={<WorksEverywhere />} />
        <Route path="/resources" element={<Resources />} />
        <Route path="/industries" element={<><PageMeta title="Industries" description="Explore Titan Zero Field Services for cleaning, landscaping, pools, pressure washing, pest control, window cleaning, property maintenance, mobile services, handyman, plumbing, electrical, HVAC, construction, roofing, tiling, concreting, painting, plastering and renovations." /><Industries /></>} />
        <Route path="/industries/:industry" element={<IndustryPath context={siteContext} />} />
        <Route path="/fully-managed" element={<><PageMeta title="Fully Managed" description="See how Titan Zero configures personal Zeros and continuously manages the governed Advanced Intelligence workforce and systems behind them." /><ManagedSystem /></>} />
        <Route path="/privacy-architecture" element={<><PageMeta title="Privacy & Architecture" description="Explore Titan Zero privacy, local intelligence, customer-controlled edge nodes, governed access and company-scoped architecture." /><Architecture /></>} />
        <Route path="/cost-sovereignty" element={<><PageMeta title="Cost Sovereignty" description="Use customer-owned providers, API keys, local models and compute where suitable, with Titan-managed services available when useful." /><CostSovereignty /></>} />
        <Route path="/environmental-systems" element={<><PageMeta title="Environmental Systems" description="Connect environmental assessment, auditing, evidence, compliance, resource improvement and qualified professional review to business operations." /><EnvironmentalSystems /></>} />
        <Route path="/compare" element={<><PageMeta title="Compare" description="Compare Titan Zero’s managed operating model, trust progression, privacy architecture and software gap filling with conventional field-service SaaS." /><Compare /></>} />
        <Route path="/about" element={<><PageMeta title="About" description="Learn the principles behind Titan Zero Field Services: keep useful systems, fill gaps, govern intelligence, preserve choice and measure operational value." /><About /></>} />
        <Route path="/faq" element={<><PageMeta title="FAQ" description="Answers about personal Zeros, the managed workforce, integrations, private and local intelligence, authority controls, environmental systems and the commercial model." /><FAQ /></>} />
        <Route path="/changelog" element={<><PageMeta title="System Evolution" description="Follow the evolution of Titan Zero Field Services and the managed operating-system capabilities available across customer deployments." /><Changelog /></>} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <Footer />
    </div>
  )
}
