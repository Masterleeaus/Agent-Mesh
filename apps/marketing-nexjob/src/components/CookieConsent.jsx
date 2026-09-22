import { useState, useEffect } from 'react'

export default function CookieConsent() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const consent = localStorage.getItem('titan_zero_cookie_consent')
    if (!consent) setVisible(true)
  }, [])

  const accept = () => {
    localStorage.setItem('titan_zero_cookie_consent', 'accepted')
    setVisible(false)
  }

  const decline = () => {
    localStorage.setItem('titan_zero_cookie_consent', 'declined')
    setVisible(false)
  }

  if (!visible) return null

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 p-4 sm:p-6">
      <div role="dialog" aria-live="polite" aria-label="Cookie preferences" className="max-w-2xl mx-auto bg-nx-surface border border-nx-border rounded-2xl p-5 shadow-2xl shadow-black/40 flex flex-col sm:flex-row items-start sm:items-center gap-4">
        <p className="text-sm text-nx-muted flex-1 leading-relaxed">
          We use cookies to understand how visitors interact with our site. No personal data is sold or shared.
        </p>
        <div className="flex gap-2 flex-shrink-0">
          <button
            type="button"
            onClick={decline}
            className="text-xs font-medium text-nx-muted2 hover:text-nx-text px-4 py-2 rounded-lg border border-nx-border transition-colors"
          >
            Decline
          </button>
          <button
            type="button"
            onClick={accept}
            className="text-xs font-semibold text-white bg-nx-purple hover:bg-nx-purple-dark px-4 py-2 rounded-lg transition-all"
          >
            Accept
          </button>
        </div>
      </div>
    </div>
  )
}
