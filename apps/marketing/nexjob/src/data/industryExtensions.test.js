import assert from 'node:assert/strict'
import test from 'node:test'
import { additionalIndustryConfigs } from './industryExtensions.js'

const requestedSlugs = [
  'handyman',
  'plumbing',
  'electrical',
  'hvac',
  'construction',
  'roofing',
  'tiling',
  'concreting',
  'painting',
  'plastering',
  'renovations',
]

const requiredJourneyStages = [
  /^Enquiry & quote$/,
  /^Booking & dispatch$/,
  /^Worker tasks & evidence$/,
  /^Completion & invoic(?:e|ing)$/,
  /history/i,
]

test('adds exactly the eleven requested trade marketing profiles', () => {
  assert.deepEqual(Object.keys(additionalIndustryConfigs), requestedSlugs)
})

test('each profile has useful metadata, trade-specific examples and the full job journey', () => {
  for (const [slug, config] of Object.entries(additionalIndustryConfigs)) {
    assert.ok(config.name.trim(), `${slug} needs a display name`)
    assert.ok(config.icon.trim(), `${slug} needs an icon`)
    assert.ok(config.headline.trim(), `${slug} needs a headline`)
    assert.ok(config.intro.trim(), `${slug} needs an introduction`)
    assert.match(config.metaDescription, /Titan Zero/, `${slug} needs branded route metadata`)
    assert.ok(config.directoryDescription.trim(), `${slug} needs directory copy`)
    assert.ok(config.tags.length >= 3, `${slug} needs directory tags`)
    assert.ok(config.pains.length >= 4, `${slug} needs specific operational context`)
    assert.ok(config.flow.length >= 6, `${slug} needs a trade workflow`)
    assert.equal(config.jobJourney.length, requiredJourneyStages.length, `${slug} needs five service-cycle stages`)

    config.jobJourney.forEach(([title, description], index) => {
      assert.match(title, requiredJourneyStages[index], `${slug} has the wrong stage ${index + 1}`)
      assert.ok(description.trim(), `${slug} stage ${index + 1} needs an explanation`)
    })

    assert.ok(config.examples.length >= 3, `${slug} needs sample use cases`)
    assert.equal(new Set(config.examples.map(([title]) => title)).size, config.examples.length, `${slug} example titles must be unique`)
    assert.ok(config.capabilities.length >= 5, `${slug} needs industry capabilities`)

    const visibleCopy = [config.headline, config.intro, config.metaDescription, config.directoryDescription,
      ...config.pains, ...config.flow,
      ...config.jobJourney.flat(), ...config.examples.flat(), ...config.capabilities.flat(),
    ].join(' ')
    assert.doesNotMatch(visibleCopy, /\b\d+%|\b(?:certified|licensed|licenced|compliant)\b/i, `${slug} must not claim unverified outcomes or compliance`)
    assert.doesNotMatch(visibleCopy, /testimonial|customer endorsement/i, `${slug} must not invent customer endorsements`)
  }
})

test('each trade has distinct sample use cases', () => {
  const titles = Object.values(additionalIndustryConfigs).flatMap(config => config.examples.map(([title]) => title))
  assert.equal(new Set(titles).size, titles.length)
})
