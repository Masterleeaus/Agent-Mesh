import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { getCanonicalUrl, getCurrentSiteContext } from '../config/siteContext'

const defaultDescription =
  'Titan Zero Field Services — managed Advanced Intelligence with personal Zeros, specialist workforce capabilities and governed business systems for field-service businesses.'

function ensureMeta(selector, attributes) {
  let meta = document.querySelector(selector)
  if (!meta) {
    meta = document.createElement('meta')
    document.head.appendChild(meta)
  }
  Object.entries(attributes).forEach(([key, value]) => meta.setAttribute(key, value))
}

export default function PageMeta({ title, description = defaultDescription }) {
  const { pathname } = useLocation()
  const siteContext = getCurrentSiteContext()
  const siteName = siteContext.kind === 'industry'
    ? `Titan Zero ${siteContext.site.name}`
    : siteContext.kind === 'hub' ? 'Titan Zero'
      : 'Titan Zero Field Services'

  useEffect(() => {
    const pageTitle = title ? `${title} | ${siteName}` : `${siteName} — Managed Advanced Intelligence`
    const canonicalUrl = getCanonicalUrl(siteContext, pathname)

    document.title = pageTitle
    ensureMeta('meta[name="description"]', { name: 'description', content: description })
    ensureMeta('meta[property="og:title"]', { property: 'og:title', content: pageTitle })
    ensureMeta('meta[property="og:description"]', { property: 'og:description', content: description })
    ensureMeta('meta[property="og:type"]', { property: 'og:type', content: 'website' })
    ensureMeta('meta[name="twitter:card"]', { name: 'twitter:card', content: 'summary' })
    ensureMeta('meta[name="twitter:title"]', { name: 'twitter:title', content: pageTitle })
    ensureMeta('meta[name="twitter:description"]', { name: 'twitter:description', content: description })

    if (canonicalUrl) {
      ensureMeta('meta[property="og:url"]', { property: 'og:url', content: canonicalUrl })
      let canonical = document.querySelector('link[rel="canonical"]')
      if (!canonical) {
        canonical = document.createElement('link')
        canonical.rel = 'canonical'
        document.head.appendChild(canonical)
      }
      canonical.href = canonicalUrl
    } else {
      document.querySelector('meta[property="og:url"]')?.remove()
      document.querySelector('link[rel="canonical"]')?.remove()
    }
  }, [title, description, pathname, siteContext.kind, siteContext.origin, siteContext.site?.name])

  return null
}
