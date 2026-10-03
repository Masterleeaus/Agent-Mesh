import { ButtonPrimary, ButtonOutline } from './Button'
import { APP_SIGNUP_AVAILABLE, appRoutes } from '../config'

export default function CTASection({
  title = 'Ready to connect your cleaning operation?',
  subtitle = 'Bring your people, AI workforce, customers and daily cleaning workflow into one connected system.',
  buttonText = 'Create your account',
  buttonTo,
  buttonHref,
  showDemo = true,
}) {
  const resolvedHref = buttonHref || (!buttonTo ? appRoutes.signup : undefined)
  const actionUnavailable = !buttonTo && (!resolvedHref || !APP_SIGNUP_AVAILABLE)

  return (
    <section className="py-24 px-6">
      <div className="max-w-7xl mx-auto">
        <div className="relative overflow-hidden rounded-2xl border border-blue-900/40 bg-gradient-to-br from-blue-950/50 to-slate-900/30 px-8 py-16 sm:px-12 text-center">
          <div className="absolute -top-24 -right-24 w-72 h-72 rounded-full bg-blue-900/20 blur-3xl pointer-events-none" />
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight mb-4 relative z-10">{title}</h2>
          <p className="text-nx-muted text-lg max-w-lg mx-auto mb-8 relative z-10">{subtitle}</p>
          <div className="relative z-10 flex justify-center gap-4 flex-wrap">
            <ButtonPrimary size="lg" to={buttonTo} href={resolvedHref} disabled={actionUnavailable}>
              {actionUnavailable ? 'Sign-up opens at launch' : buttonText} <span aria-hidden="true">&rarr;</span>
            </ButtonPrimary>
            {showDemo && <ButtonOutline size="lg" to="/fully-managed">How the managed service works</ButtonOutline>}
          </div>
        </div>
      </div>
    </section>
  )
}
