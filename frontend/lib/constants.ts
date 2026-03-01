export const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:5000'

export const COOKIE_NAMES = {
  authToken: 'authToken',
  refreshToken: 'refreshToken',
} as const

export const ROUTES = {
  home: '/',
  login: '/login',
  register: '/register',
  resetPassword: '/reset-password',
  dashboard: '/dashboard',
  track: '/track',
  search: '/search',
} as const

export const TOKEN_MAX_AGE = {
  access: 900,
  refresh: 604800,
} as const
