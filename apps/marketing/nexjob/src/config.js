// Launch destinations for the Cleaning marketing site.
// Review builds can explicitly disable account actions; production defaults to the live app routes.
const APP_URL = import.meta.env.VITE_APP_URL || 'https://app.titanzero.io'
export const APP_ACCESS_AVAILABLE = import.meta.env.VITE_APP_ACCESS_AVAILABLE !== 'false'
export const APP_SIGNUP_AVAILABLE = import.meta.env.VITE_APP_SIGNUP_AVAILABLE !== 'false'
const appDestination = `${APP_URL}/app`

export const appRoutes = {
  login: `${APP_URL}/login`,
  signup: `${APP_URL}/signup`,
  dashboard: appDestination,
  trial: `${APP_URL}/signup`,
}

export default APP_URL
