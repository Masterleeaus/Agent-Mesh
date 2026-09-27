import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Terms of Service — Titan Zero',
  description: 'Terms information for the Titan Zero marketing site.',
}

export default function TermsPage() {
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
      <div className="max-w-3xl mx-auto px-6 pt-32 pb-24">
        <div className="mb-12">
          <p className="text-sm font-bold uppercase tracking-widest mb-3" style={{ color: '#E8352A' }}>Legal</p>
          <h1 className="text-4xl md:text-5xl font-black mb-4" style={{ color: '#F2F2F2' }}>Terms of Service</h1>
          <p className="text-sm" style={{ color: '#555' }}>Last updated: July 15, 2026</p>
        </div>

        <div
          className="rounded-3xl p-8 md:p-10 space-y-8"
          style={{ background: '#111111', border: '1px solid rgba(255,255,255,0.06)', boxShadow: '0 1px 3px rgba(0,0,0,0.4), 0 4px 24px rgba(0,0,0,0.3)' }}
        >

          <section>
            <h2 className="text-xl font-black mb-3" style={{ color: '#F2F2F2' }}>1. Acceptance of Terms</h2>
            <p className="leading-relaxed text-sm" style={{ color: '#888' }}>
              By accessing or using Titan Zero (&quot;the Service&quot;) (&quot;we,&quot; &quot;our,&quot; or &quot;us&quot;), you agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use the Service.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-black mb-3" style={{ color: '#F2F2F2' }}>2. Description of Service</h2>
            <p className="leading-relaxed text-sm" style={{ color: '#888' }}>
              Titan Zero provides managed Advanced Intelligence workforce capabilities that can integrate with existing business systems, with additional software supplied where needed.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-black mb-3" style={{ color: '#F2F2F2' }}>3. Waitlist & Early Access</h2>
            <p className="leading-relaxed text-sm" style={{ color: '#888' }}>
              Joining the Titan Zero waitlist does not guarantee access to the Service. Early access and founding member pricing are offered at our discretion. We reserve the right to modify or cancel founding member offers prior to the public launch.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-black mb-3" style={{ color: '#F2F2F2' }}>4. User Accounts</h2>
            <p className="leading-relaxed text-sm mb-4" style={{ color: '#888' }}>When the Service launches:</p>
            <ul className="space-y-2 text-sm">
              {[
                'You must provide accurate and complete information when creating an account.',
                'You are responsible for maintaining the confidentiality of your account credentials.',
                'You are responsible for all activity that occurs under your account.',
                'You must notify us immediately of any unauthorized use of your account.',
                'One account per person; sharing accounts is not permitted.',
              ].map(item => (
                <li key={item} className="flex items-start gap-2" style={{ color: '#888' }}>
                  <span className="font-bold shrink-0" style={{ color: '#E8352A' }}>→</span>
                  {item}
                </li>
              ))}
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-black mb-3" style={{ color: '#F2F2F2' }}>5. Acceptable Use</h2>
            <p className="leading-relaxed text-sm mb-4" style={{ color: '#888' }}>You agree not to:</p>
            <ul className="space-y-2 text-sm">
              {[
                'Use the Service for any unlawful purpose or in violation of any regulations',
                'Attempt to gain unauthorized access to any part of the Service',
                'Interfere with or disrupt the integrity or performance of the Service',
                'Upload or transmit viruses, malicious code, or harmful content',
                'Scrape, crawl, or systematically extract data from the Service',
                'Reverse engineer or attempt to extract the source code of our software',
                'Use the Service to infringe Titan Zero intellectual property',
              ].map(item => (
                <li key={item} className="flex items-start gap-2" style={{ color: '#888' }}>
                  <span className="font-bold shrink-0" style={{ color: '#E8352A' }}>✕</span>
                  {item}
                </li>
              ))}
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-black mb-3" style={{ color: '#F2F2F2' }}>6. Subscription & Payment</h2>
            <p className="leading-relaxed text-sm" style={{ color: '#888' }}>
              Commercial terms, pricing, renewal conditions, and included services are defined in the applicable Titan Zero proposal or service agreement.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-black mb-3" style={{ color: '#F2F2F2' }}>7. Your Data</h2>
            <p className="leading-relaxed text-sm" style={{ color: '#888' }}>
              You retain ownership of the data you provide through Titan Zero. By using the Service, you grant us a limited license to process and store your data solely to provide the Service. We will not use your business data for purposes other than operating and improving the Service. See our{' '}
              <Link href="/privacy" style={{ color: '#E8352A' }} className="hover:underline">Privacy Policy</Link> for full details.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-black mb-3" style={{ color: '#F2F2F2' }}>8. Voice Data & AI Processing</h2>
            <p className="leading-relaxed text-sm" style={{ color: '#888' }}>
              Where voice or Advanced Intelligence features are enabled, processing providers, retention, and consent requirements depend on the configured deployment and applicable service agreement.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-black mb-3" style={{ color: '#F2F2F2' }}>9. Intellectual Property</h2>
            <p className="leading-relaxed text-sm" style={{ color: '#888' }}>
              The Titan Zero name, logo, software, features, and content are protected by applicable intellectual property laws. and protected by intellectual property laws. Nothing in these Terms grants you a right to use Titan Zero trademarks or intellectual property beyond what is necessary to use the Service.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-black mb-3" style={{ color: '#F2F2F2' }}>10. Disclaimer of Warranties</h2>
            <p className="leading-relaxed text-sm" style={{ color: '#888' }}>
              The Service is provided &quot;as is&quot; and &quot;as available&quot; without warranties of any kind, express or implied. We do not warrant that the Service will be uninterrupted, error-free, or free of harmful components. AI-generated content (quotes, notes, analytics) is provided as a tool — you are responsible for reviewing and verifying all outputs.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-black mb-3" style={{ color: '#F2F2F2' }}>11. Limitation of Liability</h2>
            <p className="leading-relaxed text-sm" style={{ color: '#888' }}>
              Liability terms are governed by the applicable Titan Zero service agreement and applicable law.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-black mb-3" style={{ color: '#F2F2F2' }}>12. Termination</h2>
            <p className="leading-relaxed text-sm" style={{ color: '#888' }}>
              Either party may terminate the Service relationship at any time. We may suspend or terminate your access for violation of these Terms. Upon termination, you may request an export of your data within 30 days. After that period, your data may be permanently deleted.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-black mb-3" style={{ color: '#F2F2F2' }}>13. Governing Law</h2>
            <p className="leading-relaxed text-sm" style={{ color: '#888' }}>
              These Terms are governed by the laws of the State of Delaware, United States, without regard to conflict of law provisions. Any disputes shall be resolved through binding arbitration in accordance with the American Arbitration Association rules.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-black mb-3" style={{ color: '#F2F2F2' }}>14. Changes to Terms</h2>
            <p className="leading-relaxed text-sm" style={{ color: '#888' }}>
              We may modify these Terms at any time. Material changes will be communicated via email or a prominent notice on the Service. Continued use after changes take effect constitutes acceptance of the revised Terms.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-black mb-3" style={{ color: '#F2F2F2' }}>15. Contact</h2>
            <p className="leading-relaxed text-sm" style={{ color: '#888' }}>
              Questions about these Terms? Contact us at:<br />
              <a href="mailto:legal@titanzero.io" style={{ color: '#E8352A' }} className="hover:underline font-medium">legal@titanzero.io</a>
              <br />
              Titan Zero · titanzero.io
            </p>
          </section>

        </div>
      </div>

      {/* Footer */}
      <footer className="py-8 px-6" style={{ background: '#0A0A0A', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
        <div className="max-w-3xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <Image
            src="/app_icon.png"
            alt="Titan Zero"
            width={80}
            height={22}
            className="h-5 w-auto"
            style={{ filter: 'invert(1)', opacity: 0.6 }}
          />
          <div className="flex gap-6 text-sm">
            <Link href="/privacy" className="hover:opacity-80 transition-opacity" style={{ color: '#555' }}>Privacy</Link>
            <Link href="/terms" style={{ color: '#E8352A' }} className="font-medium">Terms</Link>
            <Link href="/support" className="hover:opacity-80 transition-opacity" style={{ color: '#555' }}>Support</Link>
            <a href="mailto:hello@titanzero.io" className="hover:opacity-80 transition-opacity" style={{ color: '#555' }}>Contact</a>
          </div>
        </div>
      </footer>

    </main>
  )
}
