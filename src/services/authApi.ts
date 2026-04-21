import type { AuthUser, RegisterPayload, UpdateProfilePayload } from '../types/auth'
import { storeTokens, clearTokens, getAccessToken } from './tokenStore'

const envApiBaseUrl = import.meta.env.VITE_API_BASE_URL?.trim()
const API_BASE_URL = import.meta.env.DEV ? '' : envApiBaseUrl ?? ''

const AUTH_ME_ENDPOINT = '/api/me'

const AUTH_LOGIN_ENDPOINT = import.meta.env.VITE_AUTH_LOGIN_ENDPOINT?.trim() || '/api/login'
const AUTH_LOGOUT_ENDPOINT = import.meta.env.VITE_AUTH_LOGOUT_ENDPOINT?.trim() || '/api/logout'
const AUTH_REGISTER_ENDPOINT = import.meta.env.VITE_AUTH_REGISTER_ENDPOINT?.trim() || '/api/register'

const INSTITUTIONS_ENDPOINT = '/api/institutions'

type Institution = {
    id: number
    name: string
}

function buildApiUrl(path: string) {
    if (!API_BASE_URL) {
        return path
    }

    return `${API_BASE_URL.replace(/\/$/, '')}${path}`
}

function buildAuthHeaders(headers: Record<string, string> = {}) {
    const token = getAccessToken()
    return {
        Accept: 'application/json',
        ...headers,
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
    }
}

async function tryParseJson(response: Response) {
    const rawBody = await response.text().catch(() => '')
    if (!rawBody) {
        return null
    }

    try {
        return JSON.parse(rawBody) as unknown
    } catch {
        return null
    }
}

async function extractAuthenticityTokenFromSignInPage() {
    const response = await fetch(buildApiUrl(AUTH_LOGIN_ENDPOINT), {
        method: 'GET',
        credentials: 'include',
        headers: {
            Accept: 'text/html',
        },
    })

    if (!response.ok) {
        return null
    }

    const html = await response.text().catch(() => '')
    if (!html) {
        return null
    }

    if (typeof DOMParser === 'undefined') {
        return null
    }

    const documentFromHtml = new DOMParser().parseFromString(html, 'text/html')
    const tokenField = documentFromHtml.querySelector(
        'input[name="authenticity_token"]',
    ) as HTMLInputElement | null

    return tokenField?.value ?? null
}

function normalizeUser(payload: unknown): AuthUser | null {
    if (typeof payload !== 'object' || payload === null) {
        return null
    }

    const payloadRecord = payload as Record<string, unknown>

    if ('user' in payloadRecord) {
        return normalizeUser(payloadRecord.user)
    }

    const email =
        typeof payloadRecord.email === 'string'
            ? payloadRecord.email
            : typeof payloadRecord.user_email === 'string'
                ? payloadRecord.user_email
                : null

    if (!email) {
        return null
    }

    const rawId = payloadRecord.id
    const normalizedId =
        typeof rawId === 'number'
            ? rawId
            : typeof rawId === 'string' && rawId.trim().length > 0
                ? Number(rawId)
                : null

    const name =
        typeof payloadRecord.name === 'string'
            ? payloadRecord.name
            : typeof payloadRecord.full_name === 'string'
                ? payloadRecord.full_name
                : undefined

    const role =
        payloadRecord.role === 'admin' || payloadRecord.role === 'student'
            ? payloadRecord.role
            : undefined

    const firstName =
        typeof payloadRecord.first_name === 'string' ? payloadRecord.first_name : undefined

    const lastName =
        typeof payloadRecord.last_name === 'string' ? payloadRecord.last_name : undefined

    const rawInstitutionId = payloadRecord.institution_id
    const normalizedInstitutionId =
        typeof rawInstitutionId === 'number'
            ? rawInstitutionId
            : typeof rawInstitutionId === 'string' && rawInstitutionId.trim().length > 0
                ? Number(rawInstitutionId)
                : null

    const institutionName =
        typeof payloadRecord.institution_name === 'string'
            ? payloadRecord.institution_name
            : null

    const description = typeof payloadRecord.description === 'string' ? payloadRecord.description : null
    const career = typeof payloadRecord.career === 'string' ? payloadRecord.career : null
    const profilePhotoUrl =
        typeof payloadRecord.profile_photo_url === 'string' ? payloadRecord.profile_photo_url : null

    return {
        id: typeof normalizedId === 'number' && Number.isFinite(normalizedId) ? normalizedId : null,
        email,
        role,
        name,
        firstName,
        lastName,
        institutionId:
            typeof normalizedInstitutionId === 'number' && Number.isFinite(normalizedInstitutionId)
                ? normalizedInstitutionId
                : null,
        institutionName,
        description,
        career,
        profilePhotoUrl,
    }
}

async function extractErrorMessage(response: Response, fallbackMessage: string) {
    const parsedBody = await tryParseJson(response)

    if (parsedBody && typeof parsedBody === 'object') {
        const parsedRecord = parsedBody as Record<string, unknown>

        if (Array.isArray(parsedRecord.errors)) {
            const errors = parsedRecord.errors.filter(
                (error): error is string => typeof error === 'string',
            )

            if (errors.length > 0) {
                return errors.join(', ')
            }
        }

        if (typeof parsedRecord.error === 'string') {
            return parsedRecord.error
        }

        if (typeof parsedRecord.message === 'string') {
            return parsedRecord.message
        }
    }

    return fallbackMessage
}

async function fetchCurrentUserFromEndpoint(endpoint: string) {
    const response = await fetch(buildApiUrl(endpoint), {
        method: 'GET',
        credentials: 'include',
        headers: buildAuthHeaders(),
    })

    if (response.status === 401 || response.status === 404) {
        return null
    }

    if (!response.ok) {
        throw new Error(`Request failed: ${response.status}`)
    }

    const body = await tryParseJson(response)
    return normalizeUser(body)
}

export async function getCurrentUser() {
    return fetchCurrentUserFromEndpoint(AUTH_ME_ENDPOINT)
}

export async function loginUser(email: string, password: string) {
    const payloads: Record<string, unknown>[] = [
        {
            email,
            password,
        },
        {
            user: {
                email,
                password,
            },
        },
    ]

    let lastResponse: Response | null = null

    for (const payload of payloads) {
        const response = await fetch(buildApiUrl(AUTH_LOGIN_ENDPOINT), {
            method: 'POST',
            credentials: 'include',
            headers: buildAuthHeaders({
                'Content-Type': 'application/json',
            }),
            body: JSON.stringify(payload),
        })

        if (response.ok) {
            const body = await tryParseJson(response) as Record<string, unknown> | null
            if (body && typeof body.access === 'string') {
                storeTokens(body.access, typeof body.refresh === 'string' ? body.refresh : undefined)
            }
            const userFromLogin = normalizeUser(body)
            if (userFromLogin) {
                return userFromLogin
            }

            return (await getCurrentUser()) ?? { id: null, email }
        }

        lastResponse = response

        // For auth failures, stop trying alternative payload formats.
        if (response.status === 401 || response.status === 403) {
            throw new Error(await extractErrorMessage(response, 'Could not sign in.'))
        }
    }

    if (lastResponse?.status === 422 && AUTH_LOGIN_ENDPOINT.includes('/users/sign_in')) {
        // Legacy Devise HTML endpoint fallback.
        const authenticityToken = await extractAuthenticityTokenFromSignInPage()
        const formBody = new URLSearchParams()
        formBody.set('user[email]', email)
        formBody.set('user[password]', password)

        if (authenticityToken) {
            formBody.set('authenticity_token', authenticityToken)
        }

        const formResponse = await fetch(buildApiUrl(AUTH_LOGIN_ENDPOINT), {
            method: 'POST',
            credentials: 'include',
            headers: {
                Accept: 'application/json, text/html',
                'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
            },
            body: formBody.toString(),
            redirect: 'follow',
        })

        if (!formResponse.ok && formResponse.status !== 302 && formResponse.status !== 303) {
            throw new Error(await extractErrorMessage(formResponse, 'Could not sign in.'))
        }

        const currentUser = await getCurrentUser()
        if (currentUser) {
            return currentUser
        }

        throw new Error('Could not sign in. Check your credentials and try again.')
    }

    if (lastResponse) {
        throw new Error(await extractErrorMessage(lastResponse, 'Could not sign in.'))
    }

    throw new Error('Could not sign in.')
}

export async function registerUser(payload: RegisterPayload) {
    const formData = new FormData()
    formData.set('user[email]', payload.email)
    formData.set('user[password]', payload.password)
    formData.set('user[password_confirmation]', payload.passwordConfirmation)
    formData.set('user[first_name]', payload.firstName)
    formData.set('user[last_name]', payload.lastName)
    formData.set('user[institution_id]', String(payload.institutionId))

    if (payload.profilePhoto) {
        formData.set('user[profile_photo]', payload.profilePhoto)
    }

    const response = await fetch(buildApiUrl(AUTH_REGISTER_ENDPOINT), {
        method: 'POST',
        credentials: 'include',
        headers: buildAuthHeaders(),
        body: formData,
    })

    if (!response.ok) {
        throw new Error(await extractErrorMessage(response, 'Could not register user.'))
    }

    const body = await tryParseJson(response) as Record<string, unknown> | null
    if (body && typeof body.access === 'string') {
        storeTokens(body.access, typeof body.refresh === 'string' ? body.refresh : undefined)
    }
    const userFromRegister = normalizeUser(body)
    if (userFromRegister) {
        return userFromRegister
    }

    return (await getCurrentUser()) ?? { id: null, email: payload.email }
}

export async function updateCurrentUserProfile(payload: UpdateProfilePayload) {
    const formData = new FormData()
    formData.set('user[email]', payload.email)
    formData.set('user[first_name]', payload.firstName)
    formData.set('user[last_name]', payload.lastName)
    formData.set('user[institution_id]', String(payload.institutionId))
    formData.set('user[description]', payload.description ?? '')
    formData.set('user[career]', payload.career ?? '')

    if (payload.profilePhoto) {
        formData.set('user[profile_photo]', payload.profilePhoto)
    }

    if (payload.removeProfilePhoto) {
        formData.set('user[remove_profile_photo]', 'true')
    }

    const response = await fetch(buildApiUrl(AUTH_ME_ENDPOINT), {
        method: 'PATCH',
        credentials: 'include',
        headers: buildAuthHeaders(),
        body: formData,
    })

    if (!response.ok) {
        throw new Error(await extractErrorMessage(response, 'Could not update profile.'))
    }

    const body = await tryParseJson(response)
    const updatedUser = normalizeUser(body)
    if (updatedUser) {
        return updatedUser
    }

    throw new Error('Could not update profile.')
}

export async function getInstitutions() {
    const response = await fetch(buildApiUrl(INSTITUTIONS_ENDPOINT), {
        method: 'GET',
        credentials: 'include',
        headers: buildAuthHeaders(),
    })

    if (!response.ok) {
        throw new Error('Could not load institutions.')
    }

    const body = await tryParseJson(response)
    if (!Array.isArray(body)) {
        return []
    }

    return body
        .map((item): Institution | null => {
            if (typeof item !== 'object' || item === null) {
                return null
            }

            const record = item as Record<string, unknown>
            if (typeof record.id !== 'number' || typeof record.name !== 'string') {
                return null
            }

            return {
                id: record.id,
                name: record.name,
            }
        })
        .filter((institution): institution is Institution => institution !== null)
}

async function signOutWithMethod(method: 'DELETE' | 'POST') {
    const response = await fetch(buildApiUrl(AUTH_LOGOUT_ENDPOINT), {
        method,
        credentials: 'include',
        headers: buildAuthHeaders(),
    })

    if (response.ok || response.status === 401) {
        return
    }

    if (method === 'DELETE' && (response.status === 404 || response.status === 405)) {
        await signOutWithMethod('POST')
        return
    }

    throw new Error(await extractErrorMessage(response, 'Could not sign out.'))
}

export async function logoutUser() {
    clearTokens()
    await signOutWithMethod('DELETE')
}
