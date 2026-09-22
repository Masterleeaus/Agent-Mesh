import { useEffect } from 'react'

const defaultDescription =
  'Titan Zero Field Services — a fully managed Advanced Intelligence workforce and operating system for field-service businesses.'

export default function PageMeta({ title, description = defaultDescription }) {
  useEffect(() => {
    document.title = title ? `${title} | Titan Zero Field Services` : 'Titan Zero Field Services — Managed Advanced Intelligence Workforce'
    let meta = document.querySelector('meta[name="description"]')
    if (!meta) {
      meta = document.createElement('meta')
      meta.name = 'description'
      document.head.appendChild(meta)
    }
    meta.setAttribute('content', description)
  }, [title, description])

  return null
}
