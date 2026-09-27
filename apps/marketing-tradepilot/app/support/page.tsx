import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Support — Titan Zero',
  description: 'Get help with Titan Zero. Contact our support team.',
}

export default function SupportPage() {
  return (
    <main className="min-h-screen text-[#E8E8E8]" style={{ background: '#0A0A0A', fontFamily: "'Space Grotesk', sans-serif" }}>

      {/* Nav */}
      <nav
        className="fixed top-0 left-0 right-0 z-50 backdrop-blur-xl"
        style={{ background: 'rgba(12,12,12,0.95)', borderBottom: '1px solid rgba(255,255,255,0.06)', boxShadow: '0 1px 8px rgba(0,0,0,0.4)' }}
      >
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <Image
              src="/app_icon.png"
              alt="Titan Zero"
              width={112}
              height={28}
              className="h-7 w-auto"
            />
          </Link>
          <Link
            href="/"
            className="text-sm font-medium transition-colors"
            style={{ color: '#888', fontFamily: "'Space Grotesk', sans-serif" }}
          >
            ← Back to home
          </Link>
        </div>
      </nav>

      {/* Content */}
      <div className="max-w-2xl mx-auto px-6 pt-32 pb-24 flex flex-col items-center text-center">

        {/* Header */}
        <div className="mb-12">
          <p className="text-sm font-bold uppercase tracking-widest mb-4" style={{ color: '#E8352A' }}>Support</p>
          <h1 className="text-4xl md:text-5xl font-black mb-4" style={{ color: '#F2F2F2' }}>We&apos;ve got your back.</h1>
          <p className="text-base leading-relaxed" style={{ color: '#666' }}>
            The fastest way to get help is right inside the app.
          </p>
        </div>

        {/* Primary CTA — in-app support */}
        <div
          className="w-full rounded-3xl p-8 md:p-10 mb-6"
          style={{ background: '#111111', border: '1px solid rgba(255,255,255,0.07)', boxShadow: '0 1px 3px rgba(0,0,0,0.4), 0 4px 24px rgba(0,0,0,0.3)' }}
        >
          <div className="flex items-center justify-center w-14 h-14 rounded-2xl mx-auto mb-6" style={{ background: 'rgba(232,53,42,0.12)', border: '1px solid rgba(232,53,42,0.2)' }}>
            {/* Phone icon */}
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect x="5" y="2" width="14" height="20" rx="3" stroke="#E8352A" strokeWidth="1.75"/>
              <circle cx="12" cy="18" r="1" fill="#E8352A"/>
            </svg>
          </div>
          <h2 className="text-xl font-black mb-2" style={{ color: '#F2F2F2' }}>In-App Support</h2>
          <p className="text-sm mb-6" style={{ color: '#666' }}>
            The fastest way to reach us. Connect directly with our team from inside the app.
          </p>
          <div
            className="inline-flex items-center gap-3 rounded-2xl px-6 py-4 text-sm font-bold"
            style={{ background: '#1A1A1A', border: '1px solid rgba(255,255,255,0.08)' }}
          >
            <span style={{ color: '#888' }}>Open Titan Zero</span>
            <span style={{ color: 'rgba(255,255,255,0.2)' }}>→</span>
            <span style={{ color: '#aaa' }}>Account</span>
            <span style={{ color: 'rgba(255,255,255,0.2)' }}>→</span>
            <span style={{ color: '#E8352A' }}>Support</span>
          </div>
        </div>

        {/* Divider */}
        <div className="flex items-center gap-4 w-full mb-6">
          <div className="flex-1 h-px" style={{ background: 'rgba(255,255,255,0.06)' }} />
          <span className="text-xs font-medium uppercase tracking-widest" style={{ color: '#444' }}>or</span>
          <div className="flex-1 h-px" style={{ background: 'rgba(255,255,255,0.06)' }} />
        </div>

        {/* Email fallback */}
        <div
          className="w-full rounded-3xl p-8 mb-12"
          style={{ background: '#111111', border: '1px solid rgba(255,255,255,0.06)', boxShadow: '0 1px 3px rgba(0,0,0,0.3)' }}
        >
          <div className="flex items-center justify-center w-14 h-14 rounded-2xl mx-auto mb-6" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
            {/* Email icon */}
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect x="2" y="4" width="20" height="16" rx="3" stroke="#888" strokeWidth="1.75"/>
              <path d="M2 8l10 7 10-7" stroke="#888" strokeWidth="1.75" strokeLinejoin="round"/>
            </svg>
          </div>
          <h2 className="text-xl font-black mb-2" style={{ color: '#F2F2F2' }}>Email Support</h2>
          <p className="text-sm mb-5" style={{ color: '#666' }}>
            Not in the app yet? Send us an email and we&apos;ll get back to you within one business day.
          </p>
          <a
            href="mailto:support@titanzero.io"
            className="inline-flex items-center gap-2 rounded-xl px-5 py-3 text-sm font-bold transition-opacity hover:opacity-80"
            style={{ background: 'rgba(232,53,42,0.1)', border: '1px solid rgba(232,53,42,0.25)', color: '#E8352A' }}
          >
            support@titanzero.io
          </a>
        </div>

        {/* Footer note */}
        <p className="text-xs" style={{ color: '#3A3A3A' }}>
          Titan Zero Support · Mon–Fri 8am–6pm CT
        </p>

      </div>

      {/* Footer */}
      <footer className="py-8 px-6" style={{ background: '#0A0A0A', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
        <div className="max-w-3xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <Image
            src="/Titan Zero_2.png"
            alt="Titan Zero"
            width={80}
            height={22}
            className="h-5 w-auto"
            style={{ filter: 'invert(1)', opacity: 0.6 }}
          />
          <div className="flex gap-6 text-sm">
            <Link href="/privacy" className="hover:opacity-80 transition-opacity" style={{ color: '#555' }}>Privacy</Link>
            <Link href="/terms" className="hover:opacity-80 transition-opacity" style={{ color: '#555' }}>Terms</Link>
            <Link href="/support" style={{ color: '#E8352A' }} className="font-medium">Support</Link>
            <a href="mailto:hello@titanzero.io" className="hover:opacity-80 transition-opacity" style={{ color: '#555' }}>Contact</a>
          </div>
        </div>
      </footer>

    </main>
  )
}
