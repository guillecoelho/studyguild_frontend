import { getAccessToken, getRefreshToken, storeTokens, clearTokens } from './tokenStore'

const envApiBaseUrl = import.meta.env.VITE_API_BASE_URL?.trim()
const API_BASE_URL = import.meta.env.DEV ? '' : envApiBaseUrl ?? ''

function buildRefreshUrl() {
    const path = '/api/auth/token/refresh/'
    if (!API_BASE_URL) return path
    return `${API_BASE_URL.replace(/\/$/, '')}${path}`
}

// Single in-flight refresh prevents parallel 401s from triggering multiple refreshes.
let refreshPromise: Promise<string | null> | null = null

async function doRefresh(): Promise<string | null> {
    const refreshToken = getRefreshToken()
    if (!refreshToken) return null

    try {
        const response = await fetch(buildRefreshUrl(), {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ refresh: refreshToken }),
        })

        if (!response.ok) {
            clearTokens()
            window.dispatchEvent(new Event('sessionexpired'))
            return null
        }

        const data = (await response.json()) as { access?: string }
        if (!data.access) {
            clearTokens()
            window.dispatchEvent(new Event('sessionexpired'))
            return null
        }

        storeTokens(data.access)
        return data.access
    } catch {
        return null
    }
}

function getOrStartRefresh(): Promise<string | null> {
    if (!refreshPromise) {
        refreshPromise = doRefresh().finally(() => {
            refreshPromise = null
        })
    }
    return refreshPromise
}

export async function fetchWithAuth(input: string, init?: RequestInit): Promise<Response> {
    const response = await fetch(input, init)

    if (response.status !== 401 || !getRefreshToken()) {
        return response
    }

    const newToken = await getOrStartRefresh()
    if (!newToken) return response

    const existingHeaders = (init?.headers as Record<string, string>) ?? {}
    return fetch(input, {
        ...init,
        headers: { ...existingHeaders, Authorization: `Bearer ${newToken}` },
    })
}
