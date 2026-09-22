import { ButtonPrimary, ButtonOutline } from './Button'
import { appRoutes } from '../config'

export default function CTASection({
  title = 'Ready to run your business on autopilot?',
  subtitle = 'Join thousands of trade pros who stopped juggling spreadsheets and started growing their businesses.',
  buttonText = 'Start Free Trial',
  buttonTo,
  buttonHref,
  showDemo = true,
}) {
  // Default: link to Rails app signup if no explicit destination
  const resolvedHref = buttonHref || (!buttonTo ? appRoutes.trial : undefined)

  return (
    <section className="py-24 px-6">
      <div className="max-w-7xl mx-auto">
        <div className="relative overflow-hidden rounded-2xl border border-purple-500/20 bg-gradient-to-br from-purple-500/10 to-cyan-500/5 px-8 py-16 sm:px-12 text-center">
          {/* Glow */}
          <div className="absolute -top-24 -right-24 w-72 h-72 rounded-full bg-purple-500/15 blur-3xl pointer-events-none" />
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight mb-4 relative z-10">
            {title}
          </h2>
          <p className="text-nx-muted text-lg max-w-lg mx-auto mb-8 relative z-10">
            {subtitle}
          </p>
          <div className="relative z-10 flex justify-center gap-4 flex-wrap">
            <ButtonPrimary size="lg" to={buttonTo} href={resolvedHref}>
              {buttonText} <span>&rarr;</span>
            </ButtonPrimary>
            {showDemo && (
              <ButtonOutline size="lg" href="https://cal.com/steve-guilkey-9ooniv/15min">
                Book a Demo
              </ButtonOutline>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}
