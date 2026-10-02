// Titan Zero Field Service marketing destination contract.
// Review previews keep account access disabled until the shared app is ready.
const APP_URL = import.meta.env.VITE_APP_URL || 'https://app.titanzero.io'
export const APP_ACCESS_AVAILABLE = import.meta.env.VITE_APP_ACCESS_AVAILABLE === 'true'
const appDestination = APP_ACCESS_AVAILABLE ? `${APP_URL}/app` : undefined

export const appRoutes = {
  login: appDestination,
  signup: appDestination,
  dashboard: appDestination,
  trial: appDestination,
}

export default APP_URL
