import { Routes, Route } from 'react-router-dom'
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
import CookieConsent from './components/CookieConsent'

export default function App() {
  return (
    <div className="min-h-screen bg-nx-bg text-nx-text">
      <ScrollToTop />
      <Navbar />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/features" element={<Features />} />
        <Route path="/pricing" element={<Pricing />} />
        <Route path="/industries" element={<Industries />} />
        <Route path="/industries/:industry" element={<IndustryHome />} />
        <Route path="/fully-managed" element={<ManagedSystem />} />
        <Route path="/privacy-architecture" element={<Architecture />} />
        <Route path="/cost-sovereignty" element={<CostSovereignty />} />
        <Route path="/environmental-systems" element={<EnvironmentalSystems />} />
        <Route path="/compare" element={<Compare />} />
        <Route path="/about" element={<About />} />
        <Route path="/faq" element={<FAQ />} />
        <Route path="/changelog" element={<Changelog />} />
      </Routes>
      <Footer />
      <CookieConsent />
    </div>
  )
}
