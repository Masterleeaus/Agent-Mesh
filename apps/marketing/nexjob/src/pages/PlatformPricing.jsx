import PageMeta from '../components/PageMeta'
import SectionLabel from '../components/SectionLabel'
import { ButtonPrimary } from '../components/Button'
import { APP_SIGNUP_AVAILABLE, appRoutes } from '../config'

const plans = [
  ['Solo', 'For an owner-led cleaning business or small team.', 'Core Cleaning system and AI Assist for up to 3 people.'],
  ['Team', 'For a growing cleaning crew and office team.', 'Shared workflow, team coordination and connected work surfaces for teams up to around 10 people.'],
  ['Business', 'For larger and multi-site cleaning operations.', 'Broader workforce, operating controls and service coordination as the business grows.'],
  ['Sovereign', 'For enterprise and regulated deployment needs.', 'Advanced privacy, infrastructure, audit and deployment options for organisations with additional requirements.'],
]

export default function PlatformPricing() {
  return <>
    <PageMeta title="Cleaning SaaS Plans" description="Compare Cleaning system plans for solo operators, growing teams, larger businesses and enterprise operations." />
    <main>
      <section className="pt-32 pb-16 px-6 text-center"><div className="max-w-5xl mx-auto"><SectionLabel>Cleaning plans</SectionLabel><h1 className="text-4xl sm:text-6xl font-extrabold mb-5">A plan that fits the way your cleaning business works.</h1><p className="text-lg text-nx-muted max-w-3xl mx-auto">Start with the people and workflows you have today. Add the tools and operating controls your business needs as it grows.</p></div></section>
      <section className="px-6 pb-20"><div className="max-w-6xl mx-auto grid md:grid-cols-2 xl:grid-cols-4 gap-4">{plans.map(([name, audience, details]) => <article key={name} className="bg-nx-surface border border-nx-border rounded-2xl p-6"><p className="text-xs font-bold uppercase tracking-wide text-nx-purple-light mb-3">Cleaning plan</p><h2 className="text-2xl font-extrabold mb-3">{name}</h2><p className="text-sm font-semibold mb-3">{audience}</p><p className="text-sm text-nx-muted leading-relaxed">{details}</p></article>)}</div></section>
      <section className="px-6 pb-24"><div className="max-w-4xl mx-auto rounded-2xl border border-nx-border bg-nx-surface p-8 sm:p-10 text-center"><h2 className="text-2xl sm:text-3xl font-bold mb-4">See the plan and price for your team.</h2><p className="text-sm text-nx-muted leading-relaxed mb-7">Create an account to compare current options and see the full price before you choose. Plan access and team size never change the company’s data boundaries or who is authorised to approve business actions.</p><ButtonPrimary size="lg" href={appRoutes.signup} disabled={!APP_SIGNUP_AVAILABLE}>View plans and sign up</ButtonPrimary></div></section>
    </main>
  </>
}
