export function normalizePath(path: string): string {
  return '/' + path.split('/').filter(Boolean).join('/')
}

export function routePath(pathname: string, base: string): string | null {
  const path = normalizePath(pathname)
  const prefix = normalizePath(base)
  if (prefix === '/') return path
  if (path === prefix) return '/'
  return path.startsWith(prefix + '/') ? path.slice(prefix.length) : null
}

export function routeHref(path: string, base: string): string {
  const prefix = normalizePath(base)
  const suffix = normalizePath(path)
  return (prefix === '/' ? '' : prefix) + suffix
}
