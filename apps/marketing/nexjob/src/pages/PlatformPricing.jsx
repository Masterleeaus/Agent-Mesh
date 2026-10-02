import PageMeta from '../components/PageMeta'
import SectionLabel from '../components/SectionLabel'
import { getManagedSiteUrl } from '../config/siteContext'

export default function PlatformPricing() {
  return <>
    <PageMeta title="Platform Pricing" description="Titan Zero platform pricing is not published in this preview." />
    <main className="pt-32 pb-24 px-6"><div className="max-w-4xl mx-auto text-center"><SectionLabel>Platform pricing</SectionLabel><h1 className="text-4xl sm:text-5xl font-extrabold mb-5">Pricing details are being prepared.</h1><p className="text-lg text-nx-muted leading-relaxed">This preview does not publish an unverified platform price or imply that an account can be purchased here.</p><a className="inline-block mt-7 text-sm font-semibold text-nx-purple-light hover:text-white" href={getManagedSiteUrl('/pricing')}>Managed-service packages and pricing →</a></div></main>
  </>
}
