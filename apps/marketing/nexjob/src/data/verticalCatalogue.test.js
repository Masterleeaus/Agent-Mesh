import test from 'node:test'
import assert from 'node:assert/strict'
import {
  availabilityEvidence,
  availabilityOffers,
  getAvailability,
  getVerticalByHostname,
  getVerticalById,
  getVerticalByLegacyPath,
  marketingSiteRoles,
  verticalAliases,
  verticalCatalogue,
} from './verticalCatalogue.js'

const expectedGroups = [
  ['Recurring & property services', ['cleaning', 'window-cleaning', 'pressure-washing', 'pool-service', 'pest-control']],
  ['Technical service trades', ['plumbing', 'electrical', 'hvac', 'locksmith-security', 'appliance-equipment-repair']],
  ['Projects & building work', ['construction', 'roofing', 'tiling', 'concreting', 'renovations']],
  ['Mobile & property maintenance', ['landscaping-lawn-care', 'handyman-property-maintenance', 'mobile-services', 'painting', 'plastering']],
]

test('catalogue has the exact 20 canonical profiles in the four requested groups', () => {
  assert.equal(verticalCatalogue.length, 20)
  assert.equal(new Set(verticalCatalogue.map((vertical) => vertical.id)).size, 20)
  assert.equal(new Set(verticalCatalogue.map((vertical) => vertical.slug)).size, 20)
  for (const [group, ids] of expectedGroups) {
    const actual = verticalCatalogue.filter((vertical) => vertical.group === group).map((vertical) => vertical.id)
    assert.deepEqual(actual, ids, group)
  }
})

test('each vertical has a unique canonical host and meaningful trade-specific content', () => {
  const hosts = new Set()
  const titles = new Set()
  const wordpressSummaries = new Set()
  const chromeSummaries = new Set()
  const channelOwnerExamples = new Set()
  const channelCustomerExamples = new Set()
  for (const vertical of verticalCatalogue) {
    assert.equal(vertical.host, `${vertical.slug}.titanzero.io`)
    assert.equal(vertical.canonicalUrl, `https://${vertical.slug}.titanzero.io/`)
    assert.ok(!hosts.has(vertical.host), `duplicate host: ${vertical.host}`)
    assert.ok(!titles.has(vertical.name), `duplicate name: ${vertical.name}`)
    hosts.add(vertical.host)
    titles.add(vertical.name)
    const tradeTerm = vertical.id === 'renovations' ? 'renovat' : vertical.name.split(/[ &]/)[0]
    assert.match(vertical.intro, new RegExp(tradeTerm, 'i'))
    assert.equal(vertical.workflow.length, 5, vertical.id)
    assert.deepEqual(vertical.workflow.map(([title]) => title), [
      'Enquiry & scope', 'Assessment & quote', 'Booking & dispatch',
      'Worker tasks & evidence', 'Completion, invoice & history',
    ])
    assert.ok(vertical.workflow.every(([, detail]) => detail.length > 35), vertical.id)
    assert.equal(vertical.useCases.length, 3, vertical.id)
    assert.equal(new Set(vertical.useCases.map(([id]) => id)).size, 3, vertical.id)
    assert.ok(vertical.useCases.every(([, title, detail]) => title && detail.length > 45), vertical.id)
    assert.equal(vertical.wordpressContent.examples.length, 2, vertical.id)
    assert.equal(vertical.chromeContent.examples.length, 2, vertical.id)
    assert.ok(!wordpressSummaries.has(vertical.wordpressContent.summary), `generic WordPress content: ${vertical.id}`)
    assert.ok(!chromeSummaries.has(vertical.chromeContent.summary), `generic Chrome content: ${vertical.id}`)
    assert.ok(!channelOwnerExamples.has(vertical.workChannelContent.ownerAndStaff), `generic owner/staff channel example: ${vertical.id}`)
    assert.ok(!channelCustomerExamples.has(vertical.workChannelContent.customer), `generic customer channel example: ${vertical.id}`)
    wordpressSummaries.add(vertical.wordpressContent.summary)
    chromeSummaries.add(vertical.chromeContent.summary)
    channelOwnerExamples.add(vertical.workChannelContent.ownerAndStaff)
    channelCustomerExamples.add(vertical.workChannelContent.customer)
    assert.ok(vertical.wordpressContent.examples.every((item) => item.length > 25), vertical.id)
    assert.ok(vertical.chromeContent.examples.every((item) => item.length > 25), vertical.id)
    assert.ok(vertical.workChannelContent.ownerAndStaff.length > 40, vertical.id)
    assert.ok(vertical.workChannelContent.customer.length > 35, vertical.id)
    assert.ok(vertical.platformAvailabilityRefs.messagingChannels.length > 0, vertical.id)
  }
})

test('all legacy industry paths resolve to one canonical profile, including the combined maintenance profile', () => {
  const expectedAliases = {
    '/industries/cleaning': 'cleaning',
    '/industries/window-cleaning': 'window-cleaning',
    '/industries/pressure-washing': 'pressure-washing',
    '/industries/pools': 'pool-service',
    '/industries/pest-control': 'pest-control',
    '/industries/plumbing': 'plumbing',
    '/industries/electrical': 'electrical',
    '/industries/hvac': 'hvac',
    '/industries/locksmith-security': 'locksmith-security',
    '/industries/appliance-equipment-repair': 'appliance-equipment-repair',
    '/industries/construction': 'construction',
    '/industries/roofing': 'roofing',
    '/industries/tiling': 'tiling',
    '/industries/concreting': 'concreting',
    '/industries/renovations': 'renovations',
    '/industries/landscaping': 'landscaping-lawn-care',
    '/industries/handyman': 'handyman-property-maintenance',
    '/industries/property-maintenance': 'handyman-property-maintenance',
    '/industries/mobile-services': 'mobile-services',
    '/industries/painting': 'painting',
    '/industries/plastering': 'plastering',
  }
  assert.deepEqual(verticalAliases, expectedAliases)
  for (const [path, id] of Object.entries(expectedAliases)) {
    assert.equal(getVerticalByLegacyPath(path)?.id, id, path)
  }
  const combined = getVerticalById('handyman-property-maintenance')
  assert.deepEqual(combined.preservedContentFrom, ['handyman', 'property-maintenance'])
  assert.deepEqual(Object.keys(combined.legacyContent), ['handyman', 'propertyMaintenance'])
  assert.equal(combined.legacyContent.handyman.headline, 'Small repairs, kept moving.')
  assert.equal(combined.legacyContent.handyman.examples.length, 3)
  assert.equal(combined.legacyContent.handyman.capabilities.length, 5)
  assert.equal(combined.legacyContent.propertyMaintenance.headline, 'One managed operating layer across multi-service property work.')
  assert.equal(combined.legacyContent.propertyMaintenance.pains.length, 4)
  assert.equal(combined.legacyContent.propertyMaintenance.capabilities.length, 6)
  assert.equal(getVerticalByHostname('handyman-property-maintenance.titanzero.io')?.id, combined.id)
})

test('availability labels are backed by explicit evidence references and release proof gates Available', () => {
  const validStates = new Set(['available', 'in-development', 'planned'])
  for (const [id, offer] of Object.entries(availabilityOffers)) {
    assert.ok(validStates.has(offer.state), id)
    assert.ok(offer.label, id)
    assert.ok(offer.explanation.length > 25, id)
    assert.ok(offer.evidenceRefs.length > 0, id)
    for (const evidenceRef of offer.evidenceRefs) assert.ok(availabilityEvidence[evidenceRef], `${id} missing ${evidenceRef}`)
    if (offer.state === 'available') {
      const releaseEvidence = offer.evidenceRefs
        .map((evidenceRef) => availabilityEvidence[evidenceRef])
        .filter((evidence) => evidence.kind === 'verified-release')
      assert.ok(releaseEvidence.some((evidence) => evidence.publicInstallUrl && evidence.artifactSha256), `${id} has no verified release artifact and public install location`)
    }
  }
  assert.equal(getAvailability('nativeMobile'), availabilityOffers.nativeMobile)
  assert.equal(availabilityEvidence.apexSiteObservation.observedOn, '2026-10-02')
  assert.match(availabilityEvidence.apexSiteObservation.result, /live v2 site/)
  assert.match(availabilityEvidence.apexSiteObservation.result, /separate 20-profile host-aware review build/)
  assert.match(availabilityEvidence.appLoginRouteObservation.result, /HTTP 404 for \/login and \/app/)
  assert.match(availabilityEvidence.appLoginRouteObservation.result, /does not establish health or failure/)
  assert.doesNotMatch(JSON.stringify(availabilityEvidence), /eight industry links|no Titan Zero application/i)
  assert.equal(availabilityEvidence.noVerticalHostRelease.supportingReferences.length, 20)
  assert.deepEqual(
    new Set(availabilityEvidence.noVerticalHostRelease.supportingReferences),
    new Set(verticalCatalogue.map(({ canonicalUrl }) => canonicalUrl)),
  )
  assert.match(availabilityEvidence.noVerticalHostRelease.result, /all 20 canonical HTTPS roots/)
  assert.equal(availabilityOffers.verticalHostnames.label, 'Content not published')
  assert.match(availabilityOffers.marketingCatalogue.explanation, /apex v2 site is live/)
  assert.match(availabilityOffers.marketingCatalogue.explanation, /noindex review artifact/)
  assert.equal(availabilityEvidence.pwaSource.reference, 'https://github.com/Masterleeaus/Titan-Zero-Field-Service-Workforce/issues/1171')
  assert.match(availabilityEvidence.pwaSource.result, /does not treat apps\/web manifest or service-worker files as that PWA/)
  assert.doesNotMatch(JSON.stringify(availabilityEvidence.pwaSource), /apps\/web\/(PRODUCT|public\/sw|scripts\/generate-pwa-icons)/)
  assert.equal(availabilityOffers.marketingCatalogue.state, 'in-development')
  assert.equal(availabilityOffers.verticalHostnames.state, 'planned')
  assert.equal(availabilityOffers.wordpressVerticalPlugin.state, 'planned')
  assert.equal(availabilityOffers.chromeVerticalExtension.state, 'planned')
  assert.equal(availabilityOffers.whatsappWorkChannel.state, 'planned')
  assert.equal(availabilityOffers.telegramWorkChannel.state, 'planned')
  assert.equal(availabilityOffers.facebookMessengerWorkChannel.state, 'planned')
})

test('each vertical resolves all shared product-surface statuses without claiming live installs', () => {
  for (const vertical of verticalCatalogue) {
    const refs = [
      vertical.marketingAvailabilityRef,
      vertical.hostnameAvailabilityRef,
      vertical.runtimeAvailabilityRef,
      vertical.wordpressContent.availabilityRef,
      vertical.chromeContent.availabilityRef,
      vertical.platformAvailabilityRefs.mobileApp,
      vertical.platformAvailabilityRefs.pwa,
      vertical.platformAvailabilityRefs.chatGpt,
      ...vertical.platformAvailabilityRefs.messagingChannels,
    ]
    for (const ref of refs) assert.ok(availabilityOffers[ref], `${vertical.id} missing offer ${ref}`)
  }
  assert.equal(marketingSiteRoles.productHubHost, 'titanzero.io')
  assert.equal(getVerticalById('cleaning').runtimeAvailabilityRef, 'runtimeCleaning')
  for (const id of ['plumbing', 'electrical', 'hvac']) {
    assert.equal(getVerticalById(id).runtimeAvailabilityRef, 'runtimeLicensedTrades')
  }
  for (const vertical of verticalCatalogue.filter((item) => !['cleaning', 'plumbing', 'electrical', 'hvac'].includes(item.id))) {
    assert.equal(vertical.runtimeAvailabilityRef, 'runtimeProfilePlanned', vertical.id)
  }
})
