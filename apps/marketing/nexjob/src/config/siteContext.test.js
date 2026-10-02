import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import {
  VERTICAL_SITES,
  getCanonicalUrl,
  getIndustryDirectoryLinks,
  getLegacyIndustryRedirect,
  getManagedSiteUrl,
  getSiteNavigation,
  resolveSiteContext,
} from './siteContext.js'

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
})

test('host resolution keeps the product hub, managed site, app and vertical sites distinct', () => {
  assert.equal(resolveSiteContext('www.titanzero.io').kind, 'hub')
  assert.equal(resolveSiteContext('titanzero.pro').kind, 'managed')
  assert.equal(resolveSiteContext('app.titanzero.io').kind, 'reserved')
  assert.equal(resolveSiteContext('pwa.titanzero.io').kind, 'reserved')

  const context = resolveSiteContext('cleaning.titanzero.io')
  assert.equal(context.kind, 'industry')
  assert.equal(context.site.moduleId, 'cleaning')
  assert.equal(context.origin, 'https://cleaning.titanzero.io')
  assert.equal(resolveSiteContext('unknown.titanzero.io').kind, 'unknown')
})

test('hub navigation has the approved labels and keeps managed service off its main navigation', () => {
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
})

test('managed and vertical navigation stays contextual and the directory links to one canonical host per vertical', () => {
  const managed = getSiteNavigation(resolveSiteContext('titanzero.pro'))
  assert.deepEqual(managed.map(({ label }) => label), [
    'Overview',
    'What .pro manages',
    'Assessment & implementation',
    'Service packages & pricing',
    'Case studies',
    'FAQs',
    'Assessment request',
  ])

  const vertical = getSiteNavigation(resolveSiteContext('plumbing.titanzero.io'))
  assert.ok(vertical.some(({ label }) => label === 'WordPress'))
  assert.ok(vertical.some(({ label }) => label === 'Chrome'))
  assert.ok(vertical.some(({ label }) => label === 'Access & channels'))

  const links = getIndustryDirectoryLinks()
  assert.equal(links.length, 20)
  assert.equal(links[0].href, 'https://cleaning.titanzero.io/')
  assert.equal(links.find(({ label }) => label === 'Pool Service').href, 'https://pool-service.titanzero.io/')
  assert.equal(links.find(({ label }) => label === 'Handyman & Property Maintenance').href, 'https://handyman-property-maintenance.titanzero.io/')
})

test('canonical and legacy URL helpers redirect old industry paths without sharing cookies or embedding credentials', () => {
  const hub = resolveSiteContext('titanzero.io')
  const cleaning = resolveSiteContext('cleaning.titanzero.io')
  assert.equal(getCanonicalUrl(hub, '/features'), 'https://titanzero.io/features')
  assert.equal(getCanonicalUrl(cleaning, '/industries/cleaning'), 'https://cleaning.titanzero.io/')
  assert.equal(getLegacyIndustryRedirect(hub, '/industries/pools/'), 'https://pool-service.titanzero.io/')
  assert.equal(getLegacyIndustryRedirect(hub, '/industries/property-maintenance'), 'https://handyman-property-maintenance.titanzero.io/')
  assert.equal(getLegacyIndustryRedirect(cleaning, '/industries/cleaning'), '/')
  assert.equal(getLegacyIndustryRedirect(hub, '/industries/not-a-vertical'), null)
  assert.equal(getManagedSiteUrl('/assessment'), 'https://titanzero.pro/assessment')
  assert.ok(VERTICAL_SITES.every(({ host }) => `https://${host}.titanzero.io/`.includes('token=') === false))
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
  assert.match(rules, /RewriteRule \^ https:\/\/titanzero\.%1%\{REQUEST_URI\} \[R=301,L,NE\]/)
  const wwwRedirectIndex = lines.findIndex((line) => line.trim() === 'RewriteCond %{HTTP_HOST} ^www\\.titanzero\\.(io|pro)$ [NC]')
  assert.ok(wwwRedirectIndex >= 0)
  assert.equal(lines[wwwRedirectIndex + 1].trim(), 'RewriteRule ^ https://titanzero.%1%{REQUEST_URI} [R=301,L,NE]')
})
