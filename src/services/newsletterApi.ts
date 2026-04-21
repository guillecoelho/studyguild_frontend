import type { NewsletterEntry, NewsletterEntryPayload } from '../types/newsletter'
import { authHeader } from './tokenStore'

const envApiBaseUrl = import.meta.env.VITE_API_BASE_URL?.trim()
const API_BASE_URL = import.meta.env.DEV ? '' : envApiBaseUrl ?? ''

function buildApiUrl(path: string) {
    if (!API_BASE_URL) {
        return path
    }

    return `${API_BASE_URL.replace(/\/$/, '')}${path}`
}

async function parseApiError(response: Response, fallbackMessage: string) {
    const rawBody = await response.text().catch(() => '')

    if (!rawBody) {
        return fallbackMessage
    }

    try {
        const parsed = JSON.parse(rawBody) as {
            errors?: string[]
            error?: string
            message?: string
        }

        if (Array.isArray(parsed.errors) && parsed.errors.length > 0) {
            return parsed.errors.join(', ')
        }

        if (typeof parsed.error === 'string') {
            return parsed.error
        }

        if (typeof parsed.message === 'string') {
            return parsed.message
        }
    } catch {
        return rawBody.trim() || fallbackMessage
    }

    return fallbackMessage
}

function isNewsletterEntry(payload: unknown): payload is NewsletterEntry {
    if (typeof payload !== 'object' || payload === null) {
        return false
    }

    const record = payload as Record<string, unknown>

    return (
        (typeof record.id === 'number' || typeof record.id === 'string') &&
        typeof record.title === 'string' &&
        (record.entry_type === 'news' || record.entry_type === 'article') &&
        typeof record.content === 'string' &&
        typeof record.published_at === 'string'
    )
}

function normalizeNewsletterEntry(payload: unknown): NewsletterEntry | null {
    if (!isNewsletterEntry(payload)) {
        return null
    }

    const record = payload as Record<string, unknown>

    return {
        id: Number(record.id),
        title: record.title as string,
        entry_type: record.entry_type as NewsletterEntry['entry_type'],
        summary: typeof record.summary === 'string' ? record.summary : null,
        content: record.content as string,
        published_at: record.published_at as string,
        author_id: Number(record.author_id ?? 0),
        author_name: typeof record.author_name === 'string' ? record.author_name : '',
        created_at: typeof record.created_at === 'string' ? record.created_at : '',
        updated_at: typeof record.updated_at === 'string' ? record.updated_at : '',
    }
}

export async function getNewsletterEntries(limit = 25): Promise<NewsletterEntry[]> {
    const params = new URLSearchParams({ limit: String(limit) })
    const response = await fetch(buildApiUrl(`/api/newsletter_entries?${params.toString()}`), {
        method: 'GET',
        credentials: 'include',
        headers: { ...authHeader() },
    })

    if (!response.ok) {
        throw new Error(await parseApiError(response, 'Could not load newsletter entries.'))
    }

    const payload = await response.json()

    if (!Array.isArray(payload)) {
        return []
    }

    return payload
        .map((entry) => normalizeNewsletterEntry(entry))
        .filter((entry): entry is NewsletterEntry => entry !== null)
}

export async function createNewsletterEntry(payload: NewsletterEntryPayload): Promise<NewsletterEntry> {
    const response = await fetch(buildApiUrl('/api/newsletter_entries'), {
        method: 'POST',
        credentials: 'include',
        headers: {
            ...authHeader(),
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            newsletter_entry: {
                title: payload.title,
                entry_type: payload.entry_type,
                summary: payload.summary?.trim() || undefined,
                content: payload.content,
                published_at: payload.published_at,
            },
        }),
    })

    if (!response.ok) {
        throw new Error(await parseApiError(response, 'Could not create newsletter entry.'))
    }

    const created = normalizeNewsletterEntry(await response.json())

    if (!created) {
        throw new Error('Created entry payload was invalid.')
    }

    return created
}

export async function getNewsletterEntry(entryId: number): Promise<NewsletterEntry> {
    const response = await fetch(buildApiUrl(`/api/newsletter_entries/${entryId}`), {
        method: 'GET',
        credentials: 'include',
        headers: { ...authHeader() },
    })

    if (!response.ok) {
        throw new Error(await parseApiError(response, 'Could not load newsletter entry.'))
    }

    const entry = normalizeNewsletterEntry(await response.json())

    if (!entry) {
        throw new Error('Newsletter entry payload was invalid.')
    }

    return entry
}

export async function updateNewsletterEntry(
    entryId: number,
    payload: NewsletterEntryPayload,
): Promise<NewsletterEntry> {
    const response = await fetch(buildApiUrl(`/api/newsletter_entries/${entryId}`), {
        method: 'PATCH',
        credentials: 'include',
        headers: {
            ...authHeader(),
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            newsletter_entry: {
                title: payload.title,
                entry_type: payload.entry_type,
                summary: payload.summary?.trim() || undefined,
                content: payload.content,
                published_at: payload.published_at,
            },
        }),
    })

    if (!response.ok) {
        throw new Error(await parseApiError(response, 'Could not update newsletter entry.'))
    }

    const updated = normalizeNewsletterEntry(await response.json())

    if (!updated) {
        throw new Error('Updated entry payload was invalid.')
    }

    return updated
}

export async function deleteNewsletterEntry(entryId: number): Promise<void> {
    const response = await fetch(buildApiUrl(`/api/newsletter_entries/${entryId}`), {
        method: 'DELETE',
        credentials: 'include',
        headers: { ...authHeader() },
    })

    if (!response.ok) {
        throw new Error(await parseApiError(response, 'Could not delete newsletter entry.'))
    }
}
