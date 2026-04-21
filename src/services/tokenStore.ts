const JWT_ACCESS_KEY = 'sg_access'
const JWT_REFRESH_KEY = 'sg_refresh'

export function storeTokens(access: string, refresh?: string) {
    localStorage.setItem(JWT_ACCESS_KEY, access)
    if (refresh) localStorage.setItem(JWT_REFRESH_KEY, refresh)
}

export function clearTokens() {
    localStorage.removeItem(JWT_ACCESS_KEY)
    localStorage.removeItem(JWT_REFRESH_KEY)
}

export function getAccessToken(): string | null {
    return localStorage.getItem(JWT_ACCESS_KEY)
}

export function getRefreshToken(): string | null {
    return localStorage.getItem(JWT_REFRESH_KEY)
}

export function authHeader(): Record<string, string> {
    const token = getAccessToken()
    return token ? { Authorization: `Bearer ${token}` } : {}
}
