import { authHeader } from './tokenStore'
import { fetchWithAuth } from './fetchWithAuth'

type CreateIssueReportPayload = {
    title: string
    description: string
    images: File[]
}

export type IssueReportListItem = {
    id: number
    title: string
    description: string
    status: 'open' | 'in_progress' | 'resolved'
    reporter_id: number
    reporter_name: string
    image_count: number
    created_at: string
    updated_at: string
}

type GetIssueReportsOptions = {
    status?: 'open' | 'in_progress' | 'resolved' | 'all'
    q?: string
    page?: number
    perPage?: number
}

export type IssueReportsListResponse = {
    items: IssueReportListItem[]
    pagination: {
        page: number
        per_page: number
        total_count: number
        total_pages: number
    }
}

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

export async function createIssueReport(payload: CreateIssueReportPayload): Promise<void> {
    const formData = new FormData()
    formData.append('issue_report[title]', payload.title.trim())
    formData.append('issue_report[description]', payload.description.trim())

    payload.images.forEach((image) => {
        formData.append('issue_report[images][]', image)
    })

    const response = await fetchWithAuth(buildApiUrl('/api/issue_reports'), {
        method: 'POST',
        credentials: 'include',
        headers: { ...authHeader() },
        body: formData,
    })

    if (!response.ok) {
        throw new Error(await parseApiError(response, 'Could not submit issue report.'))
    }
}

export async function getIssueReports(options: GetIssueReportsOptions = {}): Promise<IssueReportsListResponse> {
    const status = options.status ?? 'open'
    const query = new URLSearchParams({
        status,
        page: String(options.page ?? 1),
        per_page: String(options.perPage ?? 8),
    })

    if (options.q?.trim()) {
        query.set('q', options.q.trim())
    }

    const response = await fetchWithAuth(buildApiUrl(`/api/issue_reports?${query.toString()}`), {
        method: 'GET',
        credentials: 'include',
        headers: { ...authHeader() },
    })

    if (!response.ok) {
        throw new Error(await parseApiError(response, 'Could not load issue reports.'))
    }

    const payload = await response.json()
    if (typeof payload !== 'object' || payload === null) {
        return {
            items: [],
            pagination: {
                page: 1,
                per_page: options.perPage ?? 8,
                total_count: 0,
                total_pages: 0,
            },
        }
    }

    const payloadRecord = payload as Record<string, unknown>
    const rawItems = Array.isArray(payloadRecord.items) ? payloadRecord.items : []

    const items = rawItems.filter((entry): entry is IssueReportListItem => {
        if (typeof entry !== 'object' || entry === null) {
            return false
        }

        const record = entry as Record<string, unknown>
        return (
            typeof record.id === 'number' &&
            typeof record.title === 'string' &&
            (record.status === 'open' || record.status === 'in_progress' || record.status === 'resolved')
        )
    })

    const rawPagination =
        typeof payloadRecord.pagination === 'object' && payloadRecord.pagination !== null
            ? (payloadRecord.pagination as Record<string, unknown>)
            : {}

    return {
        items,
        pagination: {
            page: typeof rawPagination.page === 'number' ? rawPagination.page : 1,
            per_page: typeof rawPagination.per_page === 'number' ? rawPagination.per_page : options.perPage ?? 8,
            total_count: typeof rawPagination.total_count === 'number' ? rawPagination.total_count : items.length,
            total_pages: typeof rawPagination.total_pages === 'number' ? rawPagination.total_pages : 1,
        },
    }
}

export async function getIssueReport(issueId: number): Promise<IssueReportListItem> {
    const response = await fetchWithAuth(buildApiUrl(`/api/issue_reports/${issueId}`), {
        method: 'GET',
        credentials: 'include',
        headers: { ...authHeader() },
    })

    if (!response.ok) {
        throw new Error(await parseApiError(response, 'Could not load this issue report.'))
    }

    const payload = await response.json()
    if (typeof payload !== 'object' || payload === null) {
        throw new Error('Issue report payload was invalid.')
    }

    const issue = payload as Record<string, unknown>
    if (
        typeof issue.id !== 'number' ||
        typeof issue.title !== 'string' ||
        typeof issue.description !== 'string' ||
        (issue.status !== 'open' && issue.status !== 'in_progress' && issue.status !== 'resolved')
    ) {
        throw new Error('Issue report payload was invalid.')
    }

    return issue as IssueReportListItem
}
