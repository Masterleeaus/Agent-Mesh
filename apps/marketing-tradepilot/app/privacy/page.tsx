import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Privacy Policy — Titan Zero',
  description: 'Privacy information for the Titan Zero marketing site.',
}

export default function PrivacyPage() {
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
            className="text-sm font-medium opacity-60 hover:opacity-100 transition-opacity"
            style={{ color: '#E8E8E8', fontFamily: "'Space Grotesk', sans-serif" }}
          >
            ← Back to home
          </Link>
        </div>
      </nav>

      {/* Content */}
      <div className="max-w-3xl mx-auto px-6 pt-32 pb-24">
        <div className="mb-12">
          <p className="text-sm font-bold uppercase tracking-widest mb-3" style={{ color: '#E8352A' }}>Legal</p>
          <h1 className="text-4xl md:text-5xl font-black mb-4" style={{ color: '#F2F2F2' }}>Privacy Policy</h1>
          <p className="text-sm" style={{ color: '#555' }}>Last updated: August 10, 2026</p>
        </div>

        <div
          className="rounded-3xl p-8 md:p-10 space-y-8"
          style={{ background: '#111111', border: '1px solid rgba(255,255,255,0.06)', boxShadow: '0 1px 3px rgba(0,0,0,0.4), 0 4px 24px rgba(0,0,0,0.3)' }}
        >

          <section>
            <h2 className="text-xl font-black mb-3" style={{ color: '#F2F2F2' }}>1. Who We Are</h2>
            <p className="leading-relaxed text-sm" style={{ color: '#888' }}>
              Titan Zero (&quot;Titan Zero,&quot; &quot;we,&quot; &quot;our,&quot; or &quot;us&quot;) operates the website at{' '}
              <a href="https://titanzero.io" style={{ color: '#E8352A' }} className="hover:underline">titanzero.io</a> and the Titan Zero service. We are committed to protecting your personal information and being transparent about how we use it.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-black mb-3" style={{ color: '#F2F2F2' }}>2. Information We Collect</h2>
            <p className="leading-relaxed text-sm mb-4" style={{ color: '#888' }}>We collect the following types of information:</p>
            <ul className="space-y-3">
              {[
                { title: 'Waitlist Information', desc: 'When you join our waitlist, we collect your first name, last name, email address, trade type, and team size.' },
                { title: 'Usage Data', desc: 'We may collect information about how you interact with our website, including pages visited, time spent, and browser type.' },
                { title: 'Voice Data (App)', desc: 'When you use VoiceLog™ in the app, audio recordings are processed to generate structured job notes. Recordings are not stored longer than necessary for processing.' },
                { title: 'Job & Business Data', desc: 'Information you provide through Titan Zero services.' },
              ].map(item => (
                <li key={item.title} className="flex gap-3 rounded-2xl px-5 py-4" style={{ background: '#161616', border: '1px solid rgba(255,255,255,0.05)' }}>
                  <span className="text-xs font-bold mt-0.5 shrink-0" style={{ color: '#E8352A' }}>→</span>
                  <div>
                    <span className="text-sm font-bold" style={{ color: '#E0E0E0' }}>{item.title}: </span>
                    <span className="text-sm" style={{ color: '#777' }}>{item.desc}</span>
                  </div>
                </li>
              ))}
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-black mb-3" style={{ color: '#F2F2F2' }}>3. How We Use Your Information</h2>
            <p className="leading-relaxed text-sm mb-4" style={{ color: '#888' }}>We use the information we collect to:</p>
            <ul className="space-y-2 text-sm">
              {[
                'Send you waitlist updates and early access notifications',
                'Personalize your onboarding experience',
                'Provide and improve the Titan Zero service',
                'Send you product updates, tips, and relevant communications',
                'Analyze usage patterns to improve our features',
                'Comply with legal obligations',
              ].map(item => (
                <li key={item} className="flex items-start gap-2" style={{ color: '#888' }}>
                  <span className="font-bold shrink-0" style={{ color: '#E8352A' }}>✓</span>
                  {item}
                </li>
              ))}
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-black mb-3" style={{ color: '#F2F2F2' }}>4. Data Sharing</h2>
            <p className="leading-relaxed text-sm" style={{ color: '#888' }}>
              We do not sell, rent, or trade your personal information to third parties. We may share your data with trusted service providers who help us operate our platform (such as email delivery services), but only to the extent necessary to provide those services. All service providers are contractually bound to protect your data.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-black mb-3" style={{ color: '#F2F2F2' }}>5. Advanced Intelligence Processing</h2>
            <p className="leading-relaxed text-sm mb-4" style={{ color: '#888' }}>
              Titan Zero can use configured Advanced Intelligence providers to process enabled features. Provider, retention, and processing details depend on the customer deployment and selected integrations.
            </p>
            <ul className="space-y-3">
              {[
                { title: 'Deployment-aware processing', desc: 'Processing depends on the providers and local or hosted services configured for your deployment.' },
                { title: 'Provider controls', desc: 'Provider-specific data controls and policies apply only when that provider is enabled for your deployment.' },
                { title: 'Data minimization', desc: 'We transmit only the minimum data necessary to perform each AI feature (e.g., a voice transcript, not your full account profile).' },
                { title: 'Retention', desc: 'Retention depends on the configured Titan Zero deployment, enabled providers, and applicable service agreement.' },
              ].map(item => (
                <li key={item.title} className="flex gap-3 rounded-2xl px-5 py-4" style={{ background: '#161616', border: '1px solid rgba(255,255,255,0.05)' }}>
                  <span className="text-xs font-bold mt-0.5 shrink-0" style={{ color: '#E8352A' }}>→</span>
                  <div>
                    <span className="text-sm font-bold" style={{ color: '#E0E0E0' }}>{item.title}: </span>
                    <span className="text-sm" style={{ color: '#777' }}>{item.desc}</span>
                  </div>
                </li>
              ))}
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-black mb-3" style={{ color: '#F2F2F2' }}>5a. Subscription Services &amp; Refund Processing</h2>
            <p className="leading-relaxed text-sm mb-4" style={{ color: '#888' }}>
              Payment and entitlement providers depend on the configured Titan Zero deployment.
              Where a third-party payment or entitlement provider is enabled, it processes applicable transaction data under its own service terms.
            </p>
            <p className="leading-relaxed text-sm" style={{ color: '#888' }}>
              When an applicable subscription is active and a refund is requested through Apple&apos;s App Store,
              Apple may send the service provider a request for subscription usage information to help evaluate that refund request.
              In that event, subscription usage data — such as your account creation date, subscription tenure, purchase
              history and delivery status may be shared with the applicable platform provider where required to process a refund.
              By purchasing a subscription, you consent to this data sharing for the purpose of refund processing.
              This data is used solely to respond to Apple&apos;s refund review process and is not used for any other purpose.
              For more information, see{' '}
              <a href="https://developer.apple.com/documentation/appstoreserverapi/consumptionrequest" style={{ color: '#E8352A' }} className="hover:underline" target="_blank" rel="noopener noreferrer">
                Apple&apos;s Consumption Request documentation
              </a>.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-black mb-3" style={{ color: '#F2F2F2' }}>6. Data Retention</h2>
            <p className="leading-relaxed text-sm" style={{ color: '#888' }}>
              Waitlist data is retained until you request removal or until the waitlist is closed and you either become a customer or opt out. App data is retained for as long as your account is active. You may request deletion of your data at any time by contacting us.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-black mb-3" style={{ color: '#F2F2F2' }}>7. Your Rights</h2>
            <p className="leading-relaxed text-sm mb-4" style={{ color: '#888' }}>Depending on your location, you may have the right to:</p>
            <ul className="space-y-2 text-sm">
              {[
                'Access the personal data we hold about you',
                'Request correction of inaccurate data',
                'Request deletion of your data',
                'Opt out of marketing communications at any time',
                'Data portability (receive your data in a machine-readable format)',
              ].map(item => (
                <li key={item} className="flex items-start gap-2" style={{ color: '#888' }}>
                  <span className="font-bold shrink-0" style={{ color: '#E8352A' }}>→</span>
                  {item}
                </li>
              ))}
            </ul>
            <p className="text-sm mt-4" style={{ color: '#888' }}>
              To exercise these rights, contact us at{' '}
              <a href="mailto:privacy@titanzero.io" style={{ color: '#E8352A' }} className="hover:underline font-medium">privacy@titanzero.io</a>.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-black mb-3" style={{ color: '#F2F2F2' }}>8. Security</h2>
            <p className="leading-relaxed text-sm" style={{ color: '#888' }}>
              We use industry-standard security measures including encryption in transit (TLS), encrypted storage, and access controls to protect your data. However, no system is 100% secure and we cannot guarantee absolute security.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-black mb-3" style={{ color: '#F2F2F2' }}>9. Cookies</h2>
            <p className="leading-relaxed text-sm" style={{ color: '#888' }}>
              Our website uses minimal cookies necessary for operation and analytics. We do not use advertising or tracking cookies. You can disable cookies in your browser settings, though some features may not function correctly.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-black mb-3" style={{ color: '#F2F2F2' }}>10. Children&apos;s Privacy</h2>
            <p className="leading-relaxed text-sm" style={{ color: '#888' }}>
              Titan Zero is not directed at children under 13. We do not knowingly collect personal information from children under 13. If you believe we have inadvertently collected such information, please contact us immediately.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-black mb-3" style={{ color: '#F2F2F2' }}>11. Changes to This Policy</h2>
            <p className="leading-relaxed text-sm" style={{ color: '#888' }}>
              We may update this Privacy Policy from time to time. We will notify you of material changes via email or a prominent notice on our website. Continued use of Titan Zero after changes constitutes acceptance of the updated policy.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-black mb-3" style={{ color: '#F2F2F2' }}>12. Contact Us</h2>
            <p className="leading-relaxed text-sm" style={{ color: '#888' }}>
              Questions about this Privacy Policy? Reach us at:<br />
              <a href="mailto:privacy@titanzero.io" style={{ color: '#E8352A' }} className="hover:underline font-medium">privacy@titanzero.io</a>
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
          <div className="flex gap-6 text-sm" style={{ color: '#555' }}>
            <Link href="/privacy" style={{ color: '#E8352A' }} className="font-medium">Privacy</Link>
            <Link href="/terms" className="hover:opacity-80 transition-opacity" style={{ color: '#555' }}>Terms</Link>
            <Link href="/support" className="hover:opacity-80 transition-opacity" style={{ color: '#555' }}>Support</Link>
            <a href="mailto:hello@titanzero.io" className="hover:opacity-80 transition-opacity" style={{ color: '#555' }}>Contact</a>
          </div>
        </div>
      </footer>

    </main>
  )
}
