import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const routes = [
  ['/', 'index.html', 'Overview'],
  ['/what-we-manage/', 'what-we-manage/index.html', 'What we manage'],
  ['/assessment-implementation/', 'assessment-implementation/index.html', 'Assessment & implementation'],
  ['/service-packages/', 'service-packages/index.html', 'Service packages'],
  ['/faqs/', 'faqs/index.html', 'FAQs'],
  ['/request-assessment/', 'request-assessment/index.html', 'Request assessment'],
]
const canonicalOrigin = 'https://titanzero.pro'
const readRoute = (file) => readFile(path.join(root, file), 'utf8')

test('all six pages have canonical metadata and one H1', async () => {
  const titles = new Set()
  const descriptions = new Set()
  for (const [route, file, navName] of routes) {
    const html = await readRoute(file)
    const title = html.match(/<title>([^<]+)<\/title>/)?.[1]
    const description = html.match(/<meta name="description" content="([^"]+)"/)?.[1]
    const canonical = html.match(/<link rel="canonical" href="([^"]+)">/)?.[1]
    const activeNav = [...html.matchAll(/<a href="([^"]+)" aria-current="page">([^<]+)<\/a>/g)].map((m) => [m[1], m[2]])
    assert.ok(title, file)
    assert.ok(description, file)
    assert.ok(!titles.has(title), 'duplicate title: ' + title)
    assert.ok(!descriptions.has(description), 'duplicate description: ' + description)
    titles.add(title)
    descriptions.add(description)
    assert.equal([...html.matchAll(/<h1\b/g)].length, 1, file)
    assert.ok(html.includes('<html lang="en-AU">'), file)
    assert.ok(html.includes('<meta name="robots" content="noindex, nofollow, noarchive">'), file)
    assert.ok(html.includes('<main id="main-content" tabindex="-1">'), file)
    assert.equal(canonical, canonicalOrigin + route, file)
    assert.deepEqual(activeNav, [[route, navName]], file)
    assert.ok(html.includes('id="main-content"'), file)
    assert.ok(html.includes('class="skip-link" href="#main-content"'), file)
  }
})

test('all internal route and asset links resolve within this directory', async () => {
  const allowedRoutes = new Set(routes.map(([route]) => route))
  for (const [, file] of routes) {
    const html = await readRoute(file)
    for (const match of html.matchAll(/\shref="(\/[^"#?]*)"/g)) {
      const href = match[1]
      if (['/favicon.svg', '/assets/site.css', '/assets/site.js'].includes(href)) {
        await readFile(path.join(root, href.slice(1)))
      } else {
        assert.ok(allowedRoutes.has(href), file + ': unknown route ' + href)
      }
    }
    assert.ok(html.includes('https://titanzero.io/'), file)
  }
})

test('the noindex review site collects no information or donor claims', async () => {
  for (const [, file] of routes) {
    const html = await readRoute(file)
    assert.doesNotMatch(html, /<\/?form\b|<input\b|<textarea\b|<select\b|type=["']?(email|tel|password)/i, file)
    assert.doesNotMatch(html, /mailto:|tel:|action=|fetch\s*\(|XMLHttpRequest|sendBeacon|localStorage|sessionStorage|calendly|analytics|tracking|pixel/i, file)
    assert.doesNotMatch(html, /trydrafted|firsthand lawns|fort lauderdale|drafted\.io|\bDrafted\b|\bInc\.?\b/i, file)
    assert.doesNotMatch(html, /\$\s?\d|\b\d+\s?(?:s|sec(?:onds?)?)\s*SLA|\b\d+\+\s*(?:clients|customers|reviews)/i, file)
    assert.doesNotMatch(html, /request received|successfully submitted/i, file)
  }
  const robots = await readFile(path.join(root, 'robots.txt'), 'utf8')
  assert.equal(robots, 'User-agent: *\nDisallow: /\n')
  const requestPage = await readRoute('request-assessment/index.html')
  assert.match(requestPage, /cannot receive or submit that request/)
  assert.match(requestPage, /no way to submit an assessment request here/)
})

test('heading outline does not skip levels', async () => {
  for (const [, file] of routes) {
    const html = await readRoute(file)
    const levels = [...html.matchAll(/<h([1-6])\b/g)].map((match) => Number(match[1]))
    assert.equal(levels[0], 1, file)
    let previous = 0
    for (const level of levels) {
      assert.ok(level <= previous + 1, file + ': heading jumps from H' + previous + ' to H' + level)
      previous = level
    }
  }
})
