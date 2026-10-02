const assert = require('node:assert/strict')
const fs = require('node:fs')
const http = require('node:http')
const path = require('node:path')
const { chromium } = require('playwright')

const root = path.resolve(__dirname, '..')
const routes = [
  ['/', 'Titan Zero Personal Services | Managed-service overview'],
  ['/what-we-manage/', 'What Titan Zero manages | Personal Services'],
  ['/assessment-implementation/', 'Assessment and implementation | Titan Zero Personal Services'],
  ['/service-packages/', 'Service packages | Titan Zero Personal Services'],
  ['/faqs/', 'FAQs | Titan Zero Personal Services'],
  ['/request-assessment/', 'Request an assessment | Titan Zero Personal Services'],
]
const mime = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.txt': 'text/plain; charset=utf-8',
}
let postRequests = 0
const server = http.createServer((request, response) => {
  if (request.method !== 'GET' && request.method !== 'HEAD') {
    postRequests += 1
    response.writeHead(405, { Allow: 'GET, HEAD' })
    response.end()
    return
  }
  const pathname = decodeURIComponent(new URL(request.url, 'http://127.0.0.1').pathname)
  let file = path.resolve(root, '.' + pathname)
  if (!file.startsWith(root + path.sep) && file !== root) {
    response.writeHead(403)
    response.end()
    return
  }
  try {
    if (fs.statSync(file).isDirectory()) file = path.join(file, 'index.html')
  } catch {}
  fs.readFile(file, (error, bytes) => {
    if (error) {
      response.writeHead(404)
      response.end('Not found')
      return
    }
    response.writeHead(200, { 'Content-Type': mime[path.extname(file)] || 'application/octet-stream' })
    response.end(bytes)
  })
})

function assertHeadingOutline(headings, route) {
  assert.equal(headings[0]?.level, 1, route + ': H1 must be first')
  assert.equal(headings.filter((heading) => heading.level === 1).length, 1, route + ': exactly one H1')
  let previous = 0
  for (const heading of headings) {
    assert.ok(heading.level <= previous + 1, route + ': heading jumps H' + previous + ' to H' + heading.level)
    previous = heading.level
  }
}

async function main() {
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve))
  const address = server.address()
  const base = 'http://127.0.0.1:' + address.port
  const browser = await chromium.launch({
    headless: true,
    executablePath: process.env.CHROMIUM_PATH || '/usr/bin/chromium',
    args: ['--no-sandbox'],
  })
  const consoleErrors = []
  const failedLocalRequests = []
  const externalRequests = []
  try {
    const desktop = await browser.newPage({ viewport: { width: 1440, height: 900 } })
    desktop.on('console', (message) => { if (message.type() === 'error') consoleErrors.push(message.text()) })
    desktop.on('requestfailed', (request) => {
      if (request.url().startsWith(base)) failedLocalRequests.push(request.url())
      else externalRequests.push(request.url())
    })
    desktop.on('response', (response) => {
      if (response.url().startsWith(base) && response.status() >= 400) failedLocalRequests.push(response.status() + ' ' + response.url())
    })

    for (const [route, title] of routes) {
      const response = await desktop.goto(base + route, { waitUntil: 'networkidle' })
      assert.equal(response.status(), 200, route + ': direct load')
      assert.equal(await desktop.title(), title, route + ': title')
      assert.equal(await desktop.locator('h1').count(), 1, route + ': one H1')
      assert.equal(await desktop.locator('html').getAttribute('lang'), 'en-AU', route + ': Australian English')
      assert.equal(await desktop.locator('meta[name="robots"]').getAttribute('content'), 'noindex, nofollow, noarchive', route + ': noindex')
      assert.equal(await desktop.locator('link[rel="canonical"]').getAttribute('href'), 'https://titanzero.pro' + route, route + ': canonical')
      assert.equal(await desktop.locator('form, input, textarea, select').count(), 0, route + ': no data-entry controls')
      const headings = await desktop.locator('h1,h2,h3,h4,h5,h6').evaluateAll((items) => items.map((element) => ({ level: Number(element.tagName.slice(1)), text: element.innerText })))
      assertHeadingOutline(headings, route)
      const dimensions = await desktop.evaluate(() => ({ width: innerWidth, scrollWidth: document.documentElement.scrollWidth }))
      assert.ok(dimensions.scrollWidth <= dimensions.width, route + ': desktop horizontal overflow')
      assert.equal(await desktop.locator('#primary-navigation a').count(), 6, route + ': six shared navigation links')
      assert.equal(await desktop.locator('#primary-navigation a[aria-current="page"]').count(), 1, route + ': active navigation item')
      const internalLinks = await desktop.locator('a[href^="/"]').evaluateAll((links) => links.map((link) => link.getAttribute('href')))
      for (const href of internalLinks) {
        const asset = await desktop.request.get(base + href)
        assert.equal(asset.status(), 200, route + ': internal link ' + href)
      }
      const firstH1 = await desktop.locator('h1').boundingBox()
      assert.ok(firstH1 && firstH1.x >= 0 && firstH1.x + firstH1.width <= dimensions.width, route + ': primary heading clipped')
      await desktop.reload({ waitUntil: 'networkidle' })
      assert.equal(await desktop.title(), title, route + ': refresh')
      const screenshot = route === '/' ? '/tmp/tz-pro-overview-1440.png' : '/tmp/tz-pro-' + route.replaceAll('/', '-') + '1440.png'
      await desktop.screenshot({ path: screenshot, fullPage: route === '/' })
    }

    const mobile = await browser.newPage({ viewport: { width: 390, height: 844 } })
    mobile.on('console', (message) => { if (message.type() === 'error') consoleErrors.push(message.text()) })
    mobile.on('requestfailed', (request) => {
      if (request.url().startsWith(base)) failedLocalRequests.push(request.url())
      else externalRequests.push(request.url())
    })
    mobile.on('response', (response) => {
      if (response.url().startsWith(base) && response.status() >= 400) failedLocalRequests.push(response.status() + ' ' + response.url())
    })

    for (const [route, title] of routes) {
      const response = await mobile.goto(base + route, { waitUntil: 'networkidle' })
      assert.equal(response.status(), 200, route + ': mobile direct load')
      assert.equal(await mobile.title(), title, route + ': mobile title')
      const dimensions = await mobile.evaluate(() => ({ width: innerWidth, scrollWidth: document.documentElement.scrollWidth }))
      assert.ok(dimensions.scrollWidth <= dimensions.width, route + ': mobile horizontal overflow')
      assert.equal(await mobile.locator('#primary-navigation a:visible').count(), 0, route + ': mobile menu starts closed')
      const toggle = mobile.locator('[data-menu-toggle]')
      await toggle.click()
      assert.equal(await toggle.getAttribute('aria-expanded'), 'true', route + ': menu opens')
      assert.equal(await mobile.locator('#primary-navigation a:visible').count(), 6, route + ': all mobile links visible')
      await toggle.press('Escape')
      assert.equal(await toggle.getAttribute('aria-expanded'), 'false', route + ': Escape closes menu')
      assert.equal(await toggle.evaluate((element) => element === document.activeElement), true, route + ': focus returns to menu toggle')
      await mobile.reload({ waitUntil: 'networkidle' })
      assert.equal(await mobile.title(), title, route + ': mobile refresh')
      const screenshot = route === '/' ? '/tmp/tz-pro-overview-390.png' : '/tmp/tz-pro-' + route.replaceAll('/', '-') + '390.png'
      await mobile.screenshot({ path: screenshot, fullPage: route === '/' })
    }

    await mobile.goto(base + '/', { waitUntil: 'networkidle' })
    await mobile.keyboard.press('Tab')
    assert.equal(await mobile.locator(':focus').getAttribute('class'), 'skip-link', 'skip link is first keyboard stop')
    await mobile.keyboard.press('Enter')
    await mobile.waitForFunction(() => location.hash === '#main-content')
    assert.equal(await mobile.locator('main').evaluate((element) => element === document.activeElement), true, 'skip link focuses the main content target')

    await mobile.goto(base + '/', { waitUntil: 'networkidle' })
    const mobileToggle = mobile.locator('[data-menu-toggle]')
    await mobile.keyboard.press('Tab')
    await mobile.keyboard.press('Tab')
    await mobile.keyboard.press('Tab')
    assert.equal(await mobileToggle.evaluate((element) => element === document.activeElement), true, 'keyboard reaches mobile menu toggle')
    await mobile.keyboard.press('Space')
    assert.equal(await mobileToggle.getAttribute('aria-expanded'), 'true', 'Space opens mobile menu')
    assert.equal(await mobile.locator('#primary-navigation a').first().evaluate((element) => element === document.activeElement), true, 'opening menu moves focus to first link')
    await mobile.keyboard.press('Escape')
    assert.equal(await mobileToggle.getAttribute('aria-expanded'), 'false', 'Escape closes mobile menu')
    assert.equal(await mobileToggle.evaluate((element) => element === document.activeElement), true, 'Escape restores focus to menu toggle')

    await mobile.keyboard.press('Enter')
    assert.equal(await mobileToggle.getAttribute('aria-expanded'), 'true', 'Enter opens mobile menu')
    for (let index = 0; index < 5; index += 1) await mobile.keyboard.press('Tab')
    assert.match(await mobile.locator(':focus').innerText(), /Request assessment/, 'keyboard reaches assessment route')
    await mobile.keyboard.press('Enter')
    await mobile.waitForURL('**/request-assessment/')
    assert.equal(await mobile.locator('[data-menu-toggle]').getAttribute('aria-expanded'), 'false', 'menu starts closed on destination')
    assert.match(await mobile.locator('h1').innerText(), /assessment/i, 'assessment path heading')
    assert.match(await mobile.locator('main').innerText(), /cannot receive or submit that request/i, 'assessment path does not claim to accept requests')

    await mobile.goBack({ waitUntil: 'networkidle' })
    assert.equal(new URL(mobile.url()).pathname, '/', 'Back returns to overview')
    assert.equal(await mobile.locator('[data-menu-toggle]').getAttribute('aria-expanded'), 'false', 'menu stays closed after Back')
    assert.equal(await mobile.locator('#primary-navigation').evaluate((nav) => nav.contains(document.activeElement)), false, 'Back does not restore focus into hidden navigation')
    await mobile.goForward({ waitUntil: 'networkidle' })
    assert.equal(new URL(mobile.url()).pathname, '/request-assessment/', 'Forward returns to assessment route')
    assert.equal(await mobile.locator('[data-menu-toggle]').getAttribute('aria-expanded'), 'false', 'menu stays closed after Forward')
    assert.equal(await mobile.locator('#primary-navigation').evaluate((nav) => nav.contains(document.activeElement)), false, 'Forward does not restore focus into hidden navigation')

    await mobile.emulateMedia({ reducedMotion: 'reduce' })
    const reducedMotion = await mobile.evaluate(() => ({
      matches: matchMedia('(prefers-reduced-motion: reduce)').matches,
      scrollBehavior: getComputedStyle(document.documentElement).scrollBehavior,
      transitionDurations: getComputedStyle(document.querySelector('#primary-navigation a')).transitionDuration.split(',').map((duration) => duration.trim()),
      animationDuration: getComputedStyle(document.querySelector('#primary-navigation a')).animationDuration,
    }))
    assert.equal(reducedMotion.matches, true, 'reduced-motion preference is active')
    assert.equal(reducedMotion.scrollBehavior, 'auto', 'reduced-motion disables smooth scrolling')
    const durationMilliseconds = (duration) => parseFloat(duration) * (duration.endsWith('ms') ? 1 : 1000)
    assert.ok(reducedMotion.transitionDurations.every((duration) => durationMilliseconds(duration) <= 0.1), 'reduced-motion minimizes transition durations')
    assert.ok(durationMilliseconds(reducedMotion.animationDuration) <= 0.1, 'reduced-motion minimizes animation duration')
    await mobile.emulateMedia({ reducedMotion: 'no-preference' })
    assert.equal(await mobile.evaluate(() => getComputedStyle(document.documentElement).scrollBehavior), 'smooth', 'default motion preference restores normal page behavior')
    assert.deepEqual(consoleErrors, [], 'no browser console errors')
    assert.deepEqual(failedLocalRequests, [], 'no failed local assets or routes')
    assert.deepEqual(externalRequests, [], 'no remote scripts, fonts, trackers or assets')
    assert.equal(postRequests, 0, 'the site sends no submissions')
  } finally {
    await browser.close()
    await new Promise((resolve) => server.close(resolve))
  }
  process.stdout.write('Passed: six routes direct-load and refresh at desktop/mobile; metadata, headings and links; skip-link and menu keyboard focus; mobile menu state across Back/Forward; reduced-motion behavior; no forms, overflow, external requests, console errors, failed local requests or submissions.\n')
}

main().catch((error) => {
  console.error(error)
  server.close()
  process.exit(1)
})
