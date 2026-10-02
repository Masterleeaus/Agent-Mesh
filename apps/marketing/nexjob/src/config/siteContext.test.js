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

test('the launch host registry exposes Cleaning only and preserves the full internal catalogue', () => {
  assert.equal(verticalCatalogue.length, 20)
  assert.equal(VERTICAL_SITES.length, 1)
  assert.equal(VERTICAL_SITES[0].moduleId, 'cleaning')
  assert.equal(VERTICAL_SITES[0].hostname, 'cleaning.titanzero.io')
  assert.equal(VERTICAL_SITES[0].profile, verticalCatalogue.find(({ id }) => id === 'cleaning'))
  assert.deepEqual(getIndustryDirectoryLinks().map(({ moduleId }) => moduleId), ['cleaning'])
})

test('the product hub, Cleaning host, app and .pro remain distinct', () => {
  assert.equal(resolveSiteContext('www.titanzero.io').kind, 'hub')
  assert.equal(resolveSiteContext('app.titanzero.io').kind, 'reserved')
  assert.equal(resolveSiteContext('pwa.titanzero.io').kind, 'reserved')
  assert.equal(resolveSiteContext('cleaning.titanzero.io').kind, 'industry')
  assert.equal(resolveSiteContext('plumbing.titanzero.io').kind, 'unknown')
  assert.equal(resolveSiteContext('titanzero.pro').kind, 'unknown')
  assert.equal(normalizeHostname(' TITANZERO.IO.:443 '), 'titanzero.io')
  assert.equal(resolveSiteContext('localhost').kind, 'preview')
  assert.equal(getSiteNavigation(resolveSiteContext('localhost')).length > 0, true)
})

test('the hub has Cleaning, Works Everywhere children and an internal managed-service page', () => {
  const nav = getSiteNavigation(resolveSiteContext('titanzero.io'))
  assert.deepEqual(nav.map(({ label }) => label), [
    'How it works', 'Features', 'AI workforce', 'Works Everywhere',
    'Cleaning', 'Pricing', 'Managed service', 'Resources',
  ])
  assert.equal(nav.find(({ label }) => label === 'Managed service').href, '/fully-managed')
  assert.equal(nav.some(({ href }) => href.includes('titanzero.pro')), false)

  const children = nav.find(({ label }) => label === 'Works Everywhere').children
  assert.deepEqual(children.map(({ label }) => label), [
    'Mobile app', 'PWA', 'Chrome extension', 'WordPress plugin',
    'ChatGPT integration', 'WhatsApp', 'Telegram', 'Facebook Messenger',
  ])
  assert.ok(children.every(({ href }) => href.startsWith('/works-everywhere#')))
})

test('the Cleaning menu is contextual and other vertical hosts are not public', () => {
  const cleaning = resolveSiteContext('cleaning.titanzero.io')
  const nav = getSiteNavigation(cleaning)
  assert.deepEqual(nav.map(({ label }) => label), [
    'How it works', 'Features', 'AI workforce', 'Works Everywhere',
    'Pricing', 'Managed service', 'Start',
  ])
  assert.equal(getIndustryDirectoryLinks().length, 1)
  assert.equal(resolveSiteContext('pool-service.titanzero.io').kind, 'unknown')
})

test('legacy paths resolve only to the Cleaning launch host', () => {
  const hub = resolveSiteContext('titanzero.io')
  const cleaning = resolveSiteContext('cleaning.titanzero.io')
  assert.equal(getCanonicalUrl(hub, '/features'), 'https://titanzero.io/features')
  assert.equal(getCanonicalUrl(cleaning), 'https://cleaning.titanzero.io/')
  assert.equal(getLegacyIndustryRedirect(hub, '/industries/cleaning/'), 'https://cleaning.titanzero.io/')
  assert.equal(getLegacyIndustryRedirect(cleaning, '/industries/cleaning'), '/')
  assert.equal(getLegacyIndustryRedirect(hub, '/industries/plumbing'), null)
})

test('only the Cleaning legacy route redirects and the review build stays noindex', () => {
  const rules = readFileSync(new URL('../../.htaccess', import.meta.url), 'utf8')
  const industryRules = rules.split(/\r?\n/).filter((line) => line.startsWith('  RewriteRule ^industries/'))
  assert.equal(industryRules.length, 1)
  assert.match(industryRules[0], /industries\/cleaning/)
  assert.match(industryRules[0], /https:\/\/cleaning\.titanzero\.io\//)
  assert.doesNotMatch(rules, /titanzero\.pro|plumbing\.titanzero\.io|pool-service\.titanzero\.io/)
  assert.equal(existsSync(new URL('../../public/sitemap.xml', import.meta.url)), false)
  const robots = readFileSync(new URL('../../public/robots.txt', import.meta.url), 'utf8')
  const entry = readFileSync(new URL('../../index.html', import.meta.url), 'utf8')
  assert.match(robots, /Disallow: \/\s*$/m)
  assert.match(entry, /noindex, nofollow/)
})

test('launch pages keep managed service internal and show accurate release states', () => {
  const appSource = readFileSync(new URL('../App.jsx', import.meta.url), 'utf8')
  const hubSource = readFileSync(new URL('../pages/PlatformHubHome.jsx', import.meta.url), 'utf8')
  const workSource = readFileSync(new URL('../pages/WorksEverywhere.jsx', import.meta.url), 'utf8')
  const cleaningSource = readFileSync(new URL('../pages/CatalogueIndustryHome.jsx', import.meta.url), 'utf8')
  assert.match(appSource, /path="\/fully-managed"/)
  assert.doesNotMatch(appSource, /titanzero\.pro|import IndustryHome|ManagedSiteHome/)
  assert.match(hubSource, /14 cleaning service variants/)
  assert.match(hubSource, /managed-service offer remains part of Titan Zero/)
  assert.doesNotMatch(hubSource, /Personal Services|titanzero\.pro|Other industries/)
  assert.match(workSource, /Facebook Messenger/)
  assert.match(workSource, /planned integrations/)
  assert.doesNotMatch(cleaningSource, /Other industries|titanzero\.pro/)
})
