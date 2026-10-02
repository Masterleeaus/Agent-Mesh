import test from 'node:test'
import assert from 'node:assert/strict'
import { existsSync, readFileSync } from 'node:fs'
import {
  MARKETING_DOMAINS,
  VERTICAL_SITES,
  getCanonicalUrl,
  getIndustryDirectoryLinks,
  getLegacyIndustryRedirect,
  normalizeHostname,
  getSiteNavigation,
  resolveSiteContext,
} from './siteContext.js'
import { verticalCatalogue } from '../data/verticalCatalogue.js'

test('the public host registry contains the approved twenty verticals exactly once', () => {
  assert.equal(VERTICAL_SITES.length, 20)
  assert.equal(new Set(VERTICAL_SITES.map(({ host }) => host)).size, 20)
  assert.deepEqual(VERTICAL_SITES.map(({ name }) => name), [
    'Cleaning',
    'Window Cleaning',
    'Pressure Washing',
    'Pool Service',
    'Pest Control',
    'Plumbing',
    'Electrical',
    'HVAC',
    'Locksmith & Security',
    'Appliance & Equipment Repair',
    'Construction',
    'Roofing',
    'Tiling',
    'Concreting',
    'Renovations',
    'Landscaping & Lawn Care',
    'Handyman & Property Maintenance',
    'Mobile Services',
    'Painting',
    'Plastering',
  ])
  assert.deepEqual(VERTICAL_SITES.map(({ moduleId }) => moduleId), verticalCatalogue.map(({ id }) => id))
  assert.ok(VERTICAL_SITES.every((site, index) => site.profile === verticalCatalogue[index]))
  assert.ok(VERTICAL_SITES.every(({ canonicalUrl, hostname }) => canonicalUrl === `https://${hostname}/`))
})

test('host resolution keeps the product hub, app and vertical sites distinct and does not render .pro', () => {
  assert.equal(resolveSiteContext('www.titanzero.io').kind, 'hub')
  assert.equal(resolveSiteContext('app.titanzero.io').kind, 'reserved')
  assert.equal(resolveSiteContext('pwa.titanzero.io').kind, 'reserved')
  for (const hostname of ['titanzero.pro', 'www.titanzero.pro', 'personal.titanzero.pro']) {
    const context = resolveSiteContext(hostname)
    assert.equal(context.kind, 'unknown')
    assert.deepEqual(getSiteNavigation(context), [])
    assert.equal(getCanonicalUrl(context), null)
  }
  assert.equal(existsSync(new URL('../pages/ManagedSiteHome.jsx', import.meta.url)), false)

  const context = resolveSiteContext('cleaning.titanzero.io')
  assert.equal(context.kind, 'industry')
  assert.equal(context.site.moduleId, 'cleaning')
  assert.equal(context.origin, 'https://cleaning.titanzero.io')
  for (const hostname of [
    'WWW.CLEANING.TITANZERO.IO',
    'cleaning.titanzero.io:443',
    'www.cleaning.titanzero.io.:443',
  ]) {
    assert.equal(resolveSiteContext(hostname).site?.moduleId, 'cleaning', hostname)
  }
  assert.equal(normalizeHostname(' TITANZERO.IO.:443 '), 'titanzero.io')
  assert.equal(resolveSiteContext('unknown.titanzero.io').kind, 'unknown')
  assert.equal(getCanonicalUrl(resolveSiteContext('unknown.titanzero.io')), null)
})

test('hub navigation has approved labels and no managed-service sales links', () => {
  const nav = getSiteNavigation(resolveSiteContext('titanzero.io'))
  assert.deepEqual(nav.map(({ label }) => label), [
    'How it works',
    'Features',
    'AI workforce',
    'Works Everywhere',
    'Industries',
    'Pricing',
    'Resources',
  ])
  assert.equal(nav.some(({ href }) => href.includes('titanzero.pro')), false)
  assert.equal(MARKETING_DOMAINS.app, 'app.titanzero.io')
})

test('vertical navigation stays contextual and the directory links to one canonical host per vertical', () => {
  const vertical = getSiteNavigation(resolveSiteContext('plumbing.titanzero.io'))
  assert.ok(vertical.some(({ label }) => label === 'WordPress'))
  assert.ok(vertical.some(({ label }) => label === 'Chrome'))
  assert.ok(vertical.some(({ label }) => label === 'Channels'))
  assert.equal(vertical.find(({ label }) => label === 'WordPress').href, '/#wordpress')
  assert.equal(vertical.find(({ label }) => label === 'Chrome').href, '/#chrome')
  assert.equal(vertical.find(({ label }) => label === 'Pricing').href, '/pricing')
  assert.equal(vertical.find(({ label }) => label === 'Start').disabled, true)

  const links = getIndustryDirectoryLinks()
  assert.equal(links.length, 20)
  assert.equal(links[0].href, 'https://cleaning.titanzero.io/')
  assert.equal(links.find(({ label }) => label === 'Pool Service').href, 'https://pool-service.titanzero.io/')
  assert.equal(links.find(({ label }) => label === 'Handyman & Property Maintenance').href, 'https://handyman-property-maintenance.titanzero.io/')
  assert.equal(links.find(({ label }) => label === 'Locksmith & Security').profile.useCases.length, 3)
})

test('every configured vertical gets one canonical menu entry for each other host', () => {
  for (const site of VERTICAL_SITES) {
    const context = resolveSiteContext(site.hostname)
    assert.equal(context.kind, 'industry', site.hostname)
    assert.equal(getCanonicalUrl(context), site.canonicalUrl, site.hostname)

    const links = getIndustryDirectoryLinks().filter(({ host }) => host !== site.host)
    assert.equal(links.length, 19, `${site.hostname} other-industry count`)
    assert.equal(new Set(links.map(({ href }) => href)).size, 19, `${site.hostname} unique menu targets`)
    assert.ok(links.every(({ href }) => href.startsWith('https://') && href.endsWith('.titanzero.io/')), site.hostname)
    assert.ok(links.every(({ href }) => !href.includes('token=') && !href.includes('titanzero.pro')), site.hostname)
  }
})

test('canonical and legacy URL helpers preserve contextual service links without sharing cookies or embedding credentials', () => {
  const hub = resolveSiteContext('titanzero.io')
  const cleaning = resolveSiteContext('cleaning.titanzero.io')
  assert.equal(getCanonicalUrl(hub, '/features'), 'https://titanzero.io/features')
  assert.equal(getCanonicalUrl(cleaning, '/industries/cleaning'), 'https://cleaning.titanzero.io/')
  assert.equal(getLegacyIndustryRedirect(hub, '/industries/pools/'), 'https://pool-service.titanzero.io/')
  assert.equal(getLegacyIndustryRedirect(hub, '/industries/property-maintenance'), 'https://handyman-property-maintenance.titanzero.io/')
  assert.equal(getLegacyIndustryRedirect(cleaning, '/industries/cleaning'), '/')
  assert.equal(getLegacyIndustryRedirect(hub, '/industries/not-a-vertical'), null)
  assert.ok(VERTICAL_SITES.every(({ host }) => `https://${host}.titanzero.io/`.includes('token=') === false))
  const appSource = readFileSync(new URL('../App.jsx', import.meta.url), 'utf8')
  assert.match(appSource, /href="https:\/\/titanzero\.pro\/"/)
  assert.doesNotMatch(appSource, /ManagedSiteHome|\/what-we-manage|\/case-studies/)
  assert.match(appSource, /Workflow examples do not confirm installed services/)
  assert.doesNotMatch(appSource, /no live service is represented/)
  const hubSource = readFileSync(new URL('../pages/PlatformHubHome.jsx', import.meta.url), 'utf8')
  assert.match(hubSource, /Implementation and ongoing management are covered on the separate service site\./)
  assert.match(hubSource, /href="https:\/\/titanzero\.pro\/"/)
  const verticalSource = readFileSync(new URL('../pages/IndustryHome.jsx', import.meta.url), 'utf8')
  assert.match(verticalSource, /\['Fully Managed','https:\/\/titanzero\.pro\/'\]/)
  assert.doesNotMatch(readFileSync(new URL('../pages/CatalogueIndustryHome.jsx', import.meta.url), 'utf8'), /titanzero\.pro/)
})

test('Apache redirects cover each legacy path on the .io apex before SPA fallback', () => {
  const rules = readFileSync(new URL('../../.htaccess', import.meta.url), 'utf8')
  const lines = rules.split(/\r?\n/)
  const industryRules = lines.flatMap((line, index) => line.startsWith('  RewriteRule ^industries/')
    ? [{ line, hostCondition: lines[index - 1] }]
    : [])

  assert.equal(industryRules.length, 20)
  for (const site of VERTICAL_SITES) {
    const rule = industryRules.find(({ line }) => line.includes(`https://${site.host}.titanzero.io/`))
    assert.ok(rule, `missing redirect for ${site.host}`)
    assert.equal(rule.hostCondition, '  RewriteCond %{HTTP_HOST} ^(www\\.)?titanzero\\.io$ [NC]')
    for (const alias of site.legacyPaths) assert.ok(rule.line.includes(alias), `missing old path ${alias}`)
  }
  assert.doesNotMatch(rules, /titanzero\.pro|\(io\|pro\)/)
  assert.match(rules, /RewriteRule \^ https:\/\/titanzero\.io%\{REQUEST_URI\} \[R=301,L,NE\]/)
  const wwwRedirectIndex = lines.findIndex((line) => line.trim() === 'RewriteCond %{HTTP_HOST} ^www\\.titanzero\\.io$ [NC]')
  assert.ok(wwwRedirectIndex >= 0)
  assert.equal(lines[wwwRedirectIndex + 1].trim(), 'RewriteRule ^ https://titanzero.io%{REQUEST_URI} [R=301,L,NE]')
})

test('review preview has no stale sitemap and blocks indexing', () => {
  const rules = readFileSync(new URL('../../.htaccess', import.meta.url), 'utf8')
  const robots = readFileSync(new URL('../../public/robots.txt', import.meta.url), 'utf8')
  const entry = readFileSync(new URL('../../index.html', import.meta.url), 'utf8')

  assert.equal(existsSync(new URL('../../public/sitemap.xml', import.meta.url)), false)
  assert.ok(rules.split(/\r?\n/).includes('  RewriteRule ^sitemap\\.xml$ - [G,L]'))
  assert.equal(robots.trim(), 'User-agent: *\nDisallow: /')
  assert.match(entry, /name="robots" content="noindex, nofollow"/)
})
