// Central config for the NexJob marketing site
// All auth-related URLs point to the Rails app

const APP_URL = import.meta.env.VITE_APP_URL || 'http://localhost:3001'

export const appRoutes = {
  login: `${APP_URL}/users/sign_in`,
  signup: `${APP_URL}/users/sign_up`,
  dashboard: `${APP_URL}/dashboard`,
  trial: `${APP_URL}/users/sign_up?plan=pro&trial=true`,
}

export default APP_URL
