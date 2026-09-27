import { ButtonPrimary, ButtonOutline } from './Button'
import { appRoutes } from '../config'

export default function CTASection({
  title = 'Ready to put a managed workforce behind your business?',
  subtitle = 'Keep the systems that work, fill the software gaps, and let Titan Zero manage the Advanced Intelligence system around your operation.',
  buttonText = 'Sign Up',
  buttonTo,
  buttonHref,
  showDemo = true,
}) {
  // Default: route consequential actions into the canonical Titan Zero Command app
  const resolvedHref = buttonHref || (!buttonTo ? appRoutes.signup : undefined)

  return (
    <section className="py-24 px-6">
      <div className="max-w-7xl mx-auto">
        <div className="relative overflow-hidden rounded-2xl border border-blue-900/40 bg-gradient-to-br from-blue-950/50 to-slate-900/30 px-8 py-16 sm:px-12 text-center">
          {/* Glow */}
          <div className="absolute -top-24 -right-24 w-72 h-72 rounded-full bg-blue-900/20 blur-3xl pointer-events-none" />
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
              <ButtonOutline size="lg" to="/fully-managed">How Fully Managed Works</ButtonOutline>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}
