import { Routes, Route, Navigate } from 'react-router-dom'
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
import IndustryHome from './pages/IndustryHome'
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

export default function App() {
  return (
    <div className="min-h-screen bg-nx-bg text-nx-text">
      <ScrollToTop />
      <Navbar />
      <Routes>
        <Route path="/" element={<><PageMeta /><Home /></>} />
        <Route path="/your-zero" element={<><PageMeta title="Your Zero" description="Meet Your Zero: a digital working intelligence that learns your business, coordinates specialist capabilities and remains under governed human authority." /><YourZero /></>} />
        <Route path="/ai-workforce" element={<><PageMeta title="AI Workforce" description="See how Your Zero coordinates specialist AI workforce capabilities across customer service, operations, finance, marketing and field-service work." /><Workforce /></>} />
        <Route path="/intelligence-decisions" element={<><PageMeta title="Intelligence & Decisions" description="Explore Titan Zero evidence, uncertainty, investigation, multiple reasoning perspectives and governed decision support." /><IntelligenceDecisions /></>} />
        <Route path="/continuous-evolution" element={<><PageMeta title="Continuous Evolution" description="See how Titan Zero observes meaningful change, reassesses the business and evolves configuration as the business changes." /><ContinuousEvolution /></>} />
        <Route path="/existing-systems" element={<><PageMeta title="Existing Systems & Integrations" description="Keep the business software that works, connect it through Titan Zero and fill genuine software gaps where required." /><ExistingSystems /></>} />
        <Route path="/real-world-intelligence" element={<><PageMeta title="Chat, Voice, Camera & Location" description="Use chat, voice, camera, visual evidence, maps and communications to bring Titan Zero intelligence closer to real-world work." /><RealWorldIntelligence /></>} />
        <Route path="/apps" element={<><PageMeta title="Command, Go & Hub" description="Explore Titan Zero Command for owners, Go for field teams and Hub for customers." /><Apps /></>} />
        <Route path="/security-recovery" element={<><PageMeta title="Security, Evidence & Recovery" description="Explore Titan Zero Shield, evidence provenance, protected intelligence and Rewind recovery principles." /><SecurityRecovery /></>} />
        <Route path="/measured-outcomes" element={<><PageMeta title="Measured Outcomes" description="Measure baseline, expected and actual outcomes so Titan Zero can learn from real business results." /><MeasuredOutcomes /></>} />
        <Route path="/features" element={<><PageMeta title="Capabilities" description="Explore the managed workforce, field operations, integration, private intelligence and software gap-filling capabilities of Titan Zero Field Services." /><Features /></>} />
        <Route path="/investment" element={<><PageMeta title="Investment" description="Illustrative Titan Zero Field Services investment examples and the launch offer for managed implementation and ongoing system management." /><Pricing /></>} />
        <Route path="/pricing" element={<Navigate to="/investment" replace />} />
        <Route path="/industries" element={<><PageMeta title="Industries" description="Titan Zero Field Services systems for cleaning, landscaping, pools, pressure washing, pest control, window cleaning, property maintenance and mobile services." /><Industries /></>} />
        <Route path="/industries/:industry" element={<IndustryHome />} />
        <Route path="/fully-managed" element={<><PageMeta title="Fully Managed" description="See how Titan Zero assesses, integrates, governs and continuously manages an Advanced Intelligence workforce around a field-service business." /><ManagedSystem /></>} />
        <Route path="/privacy-architecture" element={<><PageMeta title="Privacy & Architecture" description="Explore Titan Zero privacy, local intelligence, customer-controlled edge nodes, governed access and company-scoped architecture." /><Architecture /></>} />
        <Route path="/cost-sovereignty" element={<><PageMeta title="Cost Sovereignty" description="Use customer-owned providers, API keys, local models and compute where suitable, with Titan-managed services available when useful." /><CostSovereignty /></>} />
        <Route path="/environmental-systems" element={<><PageMeta title="Environmental Systems" description="Connect environmental assessment, auditing, evidence, compliance, resource improvement and qualified professional review to business operations." /><EnvironmentalSystems /></>} />
        <Route path="/compare" element={<><PageMeta title="Compare" description="Compare Titan Zero’s managed operating model, trust progression, privacy architecture and software gap filling with conventional field-service SaaS." /><Compare /></>} />
        <Route path="/about" element={<><PageMeta title="About" description="Learn the principles behind Titan Zero Field Services: keep useful systems, fill gaps, govern intelligence, preserve choice and measure operational value." /><About /></>} />
        <Route path="/faq" element={<><PageMeta title="FAQ" description="Answers about Titan Zero’s managed workforce, integrations, private and local AI, authority controls, environmental systems and commercial model." /><FAQ /></>} />
        <Route path="/changelog" element={<><PageMeta title="System Evolution" description="Follow the evolution of Titan Zero Field Services and the managed operating-system capabilities available across customer deployments." /><Changelog /></>} />
      </Routes>
      <Footer />
    </div>
  )
}
