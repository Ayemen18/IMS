import { useNavigate, useLocation } from 'react-router-dom'

/**
 * Compatibility wrapper around React Router so existing components that
 * call useRoute().go(...) keep working. Maps the old route keys to URLs.
 */
export type Route = 'landing' | 'roles' | 'dashboard'

const ROUTE_TO_PATH: Record<Route, string> = {
  landing: '/',
  roles:   '/login',
  dashboard: '/admin', // default landing for now; per-role redirect handled elsewhere
}

const PATH_TO_ROUTE = (path: string): Route => {
  if (path === '/' || path === '') return 'landing'
  if (path.startsWith('/login')) return 'roles'
  if (path.startsWith('/admin') || path.startsWith('/dashboard')) return 'dashboard'
  return 'landing'
}

export function useRoute() {
  const navigate = useNavigate()
  const location = useLocation()
  const route = PATH_TO_ROUTE(location.pathname)

  const go = (next: Route, _params: Record<string, string> = {}) => {
    navigate(ROUTE_TO_PATH[next])
    window.scrollTo({ top: 0, behavior: 'instant' })
  }

  return { route, params: {}, go }
}

/**
 * Direct URL navigation helper. Prefer this over `go()` for new code —
 * pass a real path like `/admin/users` or `/admin/users/usr_123`.
 */
export function useNav() {
  const navigate = useNavigate()
  return {
    push: (path: string) => {
      navigate(path)
      window.scrollTo({ top: 0, behavior: 'instant' })
    },
    replace: (path: string) => navigate(path, { replace: true }),
    back: () => navigate(-1),
  }
}
