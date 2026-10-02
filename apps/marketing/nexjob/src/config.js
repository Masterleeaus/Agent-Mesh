// Titan Zero Field Service marketing destination contract.
// Review previews keep account access disabled until the shared app is ready.
const APP_URL = import.meta.env.VITE_APP_URL || 'https://app.titanzero.io'
export const APP_ACCESS_AVAILABLE = import.meta.env.VITE_APP_ACCESS_AVAILABLE === 'true'
// `apps/web` provides /login and authenticated /app routes. It does not yet
// provide public account registration, so marketing must not link a fake
// sign-up destination.
export const APP_SIGNUP_AVAILABLE = false
const appDestination = `${APP_URL}/app`

export const appRoutes = {
  login: `${APP_URL}/login`,
  signup: undefined,
  dashboard: appDestination,
  trial: undefined,
}

export default APP_URL
