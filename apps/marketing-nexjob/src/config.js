// Titan Zero Field Service marketing destination contract.
// This standalone marketing surface routes consequential product actions
// into the canonical Titan Zero Command application.

const APP_URL = import.meta.env.VITE_APP_URL || 'https://titanzero.io'

export const appRoutes = {
  login: `${APP_URL}/app`,
  signup: `${APP_URL}/app`,
  dashboard: `${APP_URL}/app`,
  trial: `${APP_URL}/app`,
}

export default APP_URL
