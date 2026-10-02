import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'

export default function ScrollToTop() {
  const { pathname, hash } = useLocation()
  useEffect(() => {
    if (hash) {
      const target = document.getElementById(decodeURIComponent(hash.slice(1)))
      if (target) {
        window.scrollTo(0, Math.max(0, target.getBoundingClientRect().top + window.scrollY - 80))
        return
      }
    }
    window.scrollTo(0, 0)
  }, [pathname, hash])
  return null
}
