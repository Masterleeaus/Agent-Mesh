export const MARKETING_DOMAINS = Object.freeze({
  hub: 'titanzero.io',
  managed: 'titanzero.pro',
  app: 'app.titanzero.io',
})

// Public hostname catalog. Content stays in the industry modules; this list is
// only the domain/path routing contract shared by the site shell.
export const VERTICAL_SITES = Object.freeze([
  { host: 'cleaning', name: 'Cleaning', moduleId: 'cleaning', legacyPaths: ['cleaning'] },
  { host: 'window-cleaning', name: 'Window Cleaning', moduleId: 'window-cleaning', legacyPaths: ['window-cleaning'] },
  { host: 'pressure-washing', name: 'Pressure Washing', moduleId: 'pressure-washing', legacyPaths: ['pressure-washing'] },
  { host: 'pool-service', name: 'Pool Service', moduleId: 'pools', legacyPaths: ['pools', 'pool-service'] },
  { host: 'pest-control', name: 'Pest Control', moduleId: 'pest-control', legacyPaths: ['pest-control'] },
  { host: 'plumbing', name: 'Plumbing', moduleId: 'plumbing', legacyPaths: ['plumbing'] },
  { host: 'electrical', name: 'Electrical', moduleId: 'electrical', legacyPaths: ['electrical'] },
  { host: 'hvac', name: 'HVAC', moduleId: 'hvac', legacyPaths: ['hvac'] },
  { host: 'locksmith-security', name: 'Locksmith & Security', moduleId: 'locksmith-security', legacyPaths: ['locksmith-security'] },
  { host: 'appliance-equipment-repair', name: 'Appliance & Equipment Repair', moduleId: 'appliance-equipment-repair', legacyPaths: ['appliance-equipment-repair'] },
  { host: 'construction', name: 'Construction', moduleId: 'construction', legacyPaths: ['construction'] },
  { host: 'roofing', name: 'Roofing', moduleId: 'roofing', legacyPaths: ['roofing'] },
  { host: 'tiling', name: 'Tiling', moduleId: 'tiling', legacyPaths: ['tiling'] },
  { host: 'concreting', name: 'Concreting', moduleId: 'concreting', legacyPaths: ['concreting'] },
  { host: 'renovations', name: 'Renovations', moduleId: 'renovations', legacyPaths: ['renovations'] },
  { host: 'landscaping-lawn-care', name: 'Landscaping & Lawn Care', moduleId: 'landscaping', legacyPaths: ['landscaping', 'landscaping-lawn-care'] },
  { host: 'handyman-property-maintenance', name: 'Handyman & Property Maintenance', moduleId: 'handyman-property-maintenance', legacyPaths: ['handyman', 'property-maintenance', 'handyman-property-maintenance'] },
  { host: 'mobile-services', name: 'Mobile Services', moduleId: 'mobile-services', legacyPaths: ['mobile-services'] },
  { host: 'painting', name: 'Painting', moduleId: 'painting', legacyPaths: ['painting'] },
  { host: 'plastering', name: 'Plastering', moduleId: 'plastering', legacyPaths: ['plastering'] },
])

const verticalByHost = new Map(VERTICAL_SITES.map((site) => [site.host, site]))
const verticalByLegacyPath = new Map(
  VERTICAL_SITES.flatMap((site) => site.legacyPaths.map((path) => [path, site])),
)

const hubNavigation = Object.freeze([
  { label: 'How it works', href: '/#how-it-works' },
  { label: 'Features', href: '/features' },
  { label: 'AI workforce', href: '/ai-workforce' },
  { label: 'Works Everywhere', href: '/works-everywhere' },
  { label: 'Industries', href: '/industries' },
  { label: 'Pricing', href: '/pricing' },
  { label: 'Resources', href: '/resources' },
])

const managedNavigation = Object.freeze([
  { label: 'Overview', href: '/' },
  { label: 'What .pro manages', href: '/what-we-manage' },
  { label: 'Assessment & implementation', href: '/assessment' },
  { label: 'Service packages & pricing', href: '/pricing' },
  { label: 'Case studies', href: '/case-studies' },
  { label: 'FAQs', href: '/faq' },
  { label: 'Assessment request', href: '/#assessment-request', action: true },
])

const verticalNavigation = Object.freeze([
  { label: 'Overview', href: '/' },
  { label: 'Workflows', href: '/#workflows' },
  { label: 'Industry features & workforce', href: '/#features' },
  { label: 'WordPress', href: '/works-everywhere#wordpress' },
  { label: 'Chrome', href: '/works-everywhere#chrome' },
  { label: 'Access & channels', href: '/#channels' },
  { label: 'Pricing', href: '/pricing' },
  { label: 'Start', href: `https://${MARKETING_DOMAINS.app}/app`, external: true, action: true },
])

export function normalizeHostname(hostname = '') {
  return String(hostname).trim().toLowerCase().replace(/:\d+$/, '').replace(/\.$/, '')
}

function stripWww(hostname) {
  return hostname.startsWith('www.') ? hostname.slice(4) : hostname
}

function verticalOrigin(site) {
  return `https://${site.host}.${MARKETING_DOMAINS.hub}`
}

export function resolveSiteContext(hostname) {
  const normalized = stripWww(normalizeHostname(hostname))

  if (normalized === 'localhost' || normalized === '127.0.0.1') {
    return { kind: 'preview', hostname: normalized, origin: null }
  }

  if (normalized === MARKETING_DOMAINS.hub) {
    return { kind: 'hub', hostname: normalized, origin: `https://${MARKETING_DOMAINS.hub}` }
  }

  if (normalized === MARKETING_DOMAINS.managed) {
    return { kind: 'managed', hostname: normalized, origin: `https://${MARKETING_DOMAINS.managed}` }
  }

  if (normalized === MARKETING_DOMAINS.app || normalized === 'pwa.titanzero.io') {
    return { kind: 'reserved', hostname: normalized }
  }

  const suffix = `.${MARKETING_DOMAINS.hub}`
  if (normalized.endsWith(suffix)) {
    const host = normalized.slice(0, -suffix.length)
    const site = verticalByHost.get(host)
    if (site) return { kind: 'industry', hostname: normalized, origin: verticalOrigin(site), site }
  }

  return { kind: 'unknown', hostname: normalized }
}

export function getSiteNavigation(context) {
  if (context?.kind === 'hub') return hubNavigation
  if (context?.kind === 'managed') return managedNavigation
  if (context?.kind === 'industry') return verticalNavigation
  return Object.freeze([])
}

export function getIndustryDirectoryLinks() {
  return VERTICAL_SITES.map((site) => ({
    label: site.name,
    href: `${verticalOrigin(site)}/`,
    host: site.host,
    moduleId: site.moduleId,
  }))
}

export function getVerticalSiteForLegacyPath(routeSlug) {
  return verticalByLegacyPath.get(String(routeSlug || '').toLowerCase()) || null
}

export function getCanonicalUrl(context, pathname = '/') {
  if (context?.kind === 'industry') return `${context.origin}/`
  if (context?.kind === 'hub' || context?.kind === 'managed') {
    const path = pathname === '/' ? '/' : `/${pathname.replace(/^\/+|\/+$/g, '')}`
    return `${context.origin}${path}`
  }
  return null
}

export function getLegacyIndustryRedirect(context, pathname = '/') {
  const match = String(pathname).match(/^\/industries\/([^/]+)\/?$/)
  if (!match) return null

  const target = verticalByLegacyPath.get(decodeURIComponent(match[1]).toLowerCase())
  if (!target) return null

  const targetUrl = `${verticalOrigin(target)}/`
  if (context?.kind === 'industry' && context.site?.host === target.host) return '/'
  return targetUrl
}

export function getManagedSiteUrl(path = '/') {
  const normalizedPath = path === '/' ? '/' : `/${String(path).replace(/^\/+|\/+$/g, '')}`
  return `https://${MARKETING_DOMAINS.managed}${normalizedPath}`
}

export function getCurrentSiteContext() {
  const hostname = globalThis.location?.hostname || 'localhost'
  return resolveSiteContext(hostname)
}
