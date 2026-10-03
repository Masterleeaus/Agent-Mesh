import {
  getVerticalByHostname,
  getVerticalByLegacyPath,
  verticalCatalogue,
} from '../data/verticalCatalogue.js'

export const MARKETING_DOMAINS = Object.freeze({
  hub: 'titanzero.io',
  app: 'app.titanzero.io',
})

// Only Cleaning is public for this launch. Keep the complete canonical catalogue for future releases.
const PUBLIC_LAUNCH_VERTICAL_IDS = new Set(['cleaning'])

export const VERTICAL_SITES = Object.freeze(verticalCatalogue.filter(({ id }) => PUBLIC_LAUNCH_VERTICAL_IDS.has(id)).map((profile) => Object.freeze({
  host: profile.slug,
  hostname: profile.host,
  name: profile.name,
  moduleId: profile.id,
  canonicalUrl: profile.canonicalUrl,
  profile,
  legacyPaths: Object.freeze([...new Set([
    profile.slug,
    ...profile.legacyPaths.map((path) => path.replace(/^\/industries\//, '')),
  ])]),
})))

const verticalByHost = new Map(VERTICAL_SITES.map((site) => [site.host, site]))
const verticalByHostname = new Map(VERTICAL_SITES.map((site) => [site.hostname, site]))
const verticalByLegacyPath = new Map(
  VERTICAL_SITES.flatMap((site) => site.legacyPaths.map((path) => [`/industries/${path}`, site])),
)

const worksEverywhereNavigation = Object.freeze([
  { label: 'Mobile app', href: '/works-everywhere#mobile-app' },
  { label: 'PWA', href: '/works-everywhere#pwa' },
  { label: 'Chrome extensions', href: '/chrome-extensions' },
  { label: 'WordPress plugins', href: '/wordpress-plugins' },
  { label: 'ChatGPT', href: '/works-everywhere#chatgpt' },
  { label: 'WhatsApp', href: '/works-everywhere#whatsapp' },
  { label: 'Telegram', href: '/works-everywhere#telegram' },
  { label: 'Facebook Messenger', href: '/works-everywhere#messenger' },
])

const growthNavigation = Object.freeze([
  { label: 'AI Reception', href: '/reception' },
  { label: 'Omnichannel marketing', href: '/marketing' },
  { label: 'Lead generation', href: '/lead-generation' },
])

const moreNavigation = Object.freeze([
  { label: 'What is Titan Zero?', href: '/titan-zero' },
  { label: 'Managed service', href: '/fully-managed' },
  { label: 'Resources & FAQ', href: '/resources' },
])

const hubNavigation = Object.freeze([
  { label: 'How it works', href: '/#how-it-works' },
  { label: 'Features', href: '/features' },
  { label: 'AI workforce', href: '/ai-workforce' },
  { label: 'Works Everywhere', href: '/works-everywhere', children: worksEverywhereNavigation },
  { label: 'Customer growth', href: '/marketing', children: growthNavigation },
  { label: 'Cleaning', href: '/industries/cleaning' },
  { label: 'Pricing', href: '/pricing' },
  { label: 'More', href: '/resources', children: moreNavigation },
])

const verticalNavigation = Object.freeze([
  { label: 'How it works', href: '/#workflows' },
  { label: 'Features', href: '/#features' },
  { label: 'AI workforce', href: '/ai-workforce' },
  { label: 'Works Everywhere', href: '/works-everywhere', children: worksEverywhereNavigation },
  { label: 'Customer growth', href: '/marketing', children: growthNavigation },
  { label: 'What is Titan Zero?', href: '/titan-zero' },
  { label: 'Pricing', href: '/pricing' },
  { label: 'Managed service', href: '/fully-managed' },
])

export function normalizeHostname(hostname = '') {
  return String(hostname).trim().toLowerCase().replace(/:\d+$/, '').replace(/\.$/, '')
}

function stripWww(hostname) {
  return hostname.startsWith('www.') ? hostname.slice(4) : hostname
}

function verticalOrigin(site) {
  return (site.canonicalUrl || `https://${site.host}.${MARKETING_DOMAINS.hub}/`).replace(/\/$/, '')
}

export function resolveSiteContext(hostname) {
  const normalized = stripWww(normalizeHostname(hostname))

  if (normalized === 'localhost' || normalized === '127.0.0.1') {
    return { kind: 'preview', hostname: normalized, origin: null }
  }

  if (normalized === MARKETING_DOMAINS.hub) {
    return { kind: 'hub', hostname: normalized, origin: `https://${MARKETING_DOMAINS.hub}` }
  }

  if (normalized === MARKETING_DOMAINS.app || normalized === 'pwa.titanzero.io') {
    return { kind: 'reserved', hostname: normalized }
  }

  const suffix = `.${MARKETING_DOMAINS.hub}`
  if (normalized.endsWith(suffix)) {
    const host = normalized.slice(0, -suffix.length)
    const profile = getVerticalByHostname(normalized)
    const site = profile ? verticalByHost.get(host) : null
    if (site) return { kind: 'industry', hostname: normalized, origin: verticalOrigin(site), site }
  }

  return { kind: 'unknown', hostname: normalized }
}

export function getSiteNavigation(context) {
  if (context?.kind === 'hub' || context?.kind === 'preview') return hubNavigation
  if (context?.kind === 'industry') return verticalNavigation
  return Object.freeze([])
}

export function getIndustryDirectoryLinks() {
  return VERTICAL_SITES.map((site) => ({
    label: site.name,
    href: site.canonicalUrl,
    host: site.host,
    moduleId: site.moduleId,
    profile: site.profile,
  }))
}

export function getVerticalSiteForLegacyPath(routeSlug) {
  const slug = String(routeSlug || '').toLowerCase()
  return verticalByLegacyPath.get(`/industries/${slug}`)
    || (() => {
      const profile = getVerticalByLegacyPath(`/industries/${slug}`)
      return profile ? verticalByHost.get(profile.slug) || null : null
    })()
}

export function getCanonicalUrl(context, pathname = '/') {
  if (context?.kind === 'industry') return `${context.origin}/`
  if (context?.kind === 'hub') {
    const path = pathname === '/' ? '/' : `/${pathname.replace(/^\/+|\/+$/g, '')}`
    return `${context.origin}${path}`
  }
  return null
}

export function getLegacyIndustryRedirect(context, pathname = '/') {
  const match = String(pathname).match(/^\/industries\/([^/]+)\/?$/)
  if (!match) return null

  const target = verticalByLegacyPath.get(`/industries/${decodeURIComponent(match[1]).toLowerCase()}`)
  if (!target) return null

  const targetUrl = `${verticalOrigin(target)}/`
  if (context?.kind === 'industry' && context.site?.host === target.host) return '/'
  return targetUrl
}

export function getCurrentSiteContext() {
  const hostname = globalThis.location?.hostname || 'localhost'
  return resolveSiteContext(hostname)
}
