import { authHeader, getAccessToken } from './tokenStore'
import type {
    ApiError,
    InvitableStudent,
    Reunion,
    ReunionFilters,
    ReunionMessage,
    ReunionParticipant,
    ReunionPayload,
    PublicStudentProfile,
    StudentGroupInvitation,
    StudentGroupPayload,
    StudentGroup,
    Subject,
} from '../types/reunions'

const envApiBaseUrl = import.meta.env.VITE_API_BASE_URL?.trim()
const API_BASE_URL = import.meta.env.DEV ? '' : envApiBaseUrl ?? ''


function buildApiUrl(path: string) {
    if (!API_BASE_URL) {
        return path
    }

    return `${API_BASE_URL.replace(/\/$/, '')}${path}`
}

function normalizeCollection<T extends { id: number; name: string }>(
    payload: unknown,
    key: string,
): T[] {
    if (Array.isArray(payload)) {
        return payload
            .filter((item): item is T => {
                return (
                    typeof item === 'object' &&
                    item !== null &&
                    'id' in item &&
                    'name' in item &&
                    typeof (item as { name: string }).name === 'string'
                )
            })
            .map((item) => ({
                ...item,
                id: Number(item.id),
            }))
    }

    if (typeof payload === 'object' && payload !== null && key in payload) {
        return normalizeCollection<T>((payload as Record<string, unknown>)[key], key)
    }

    return []
}

function normalizeReunions(payload: unknown): Reunion[] {
    if (Array.isArray(payload)) {
        return payload
            .filter((item): item is Reunion => {
                return (
                    typeof item === 'object' &&
                    item !== null &&
                    'id' in item &&
                    'title' in item &&
                    'scheduled_for' in item
                )
            })
            .map((item) => ({
                ...item,
                id: Number(item.id),
            }))
    }

    if (typeof payload === 'object' && payload !== null && 'reunions' in payload) {
        return normalizeReunions((payload as Record<string, unknown>).reunions)
    }

    return []
}

function normalizeParticipants(payload: unknown): ReunionParticipant[] {
    if (!Array.isArray(payload)) {
        return []
    }

    return payload
        .map((item) => {
            if (typeof item === 'string') {
                return {
                    id: 0,
                    name: item,
                }
            }

            if (typeof item !== 'object' || item === null) {
                return null
            }

            const itemRecord = item as Record<string, unknown>
            const idValue =
                typeof itemRecord.id === 'number'
                    ? itemRecord.id
                    : typeof itemRecord.student_id === 'number'
                        ? itemRecord.student_id
                        : 0
            const nameValue =
                typeof itemRecord.name === 'string'
                    ? itemRecord.name
                    : typeof itemRecord.student_name === 'string'
                        ? itemRecord.student_name
                        : null

            if (!nameValue) {
                return null
            }

            return {
                id: Number(idValue),
                name: nameValue,
            }
        })
        .filter((participant): participant is ReunionParticipant => participant !== null)
}

function normalizeReunionMessage(payload: unknown): ReunionMessage | null {
    if (typeof payload !== 'object' || payload === null) {
        return null
    }

    const record = payload as Record<string, unknown>

    if (
        !('id' in record) ||
        !('reunion_id' in record) ||
        !('student_id' in record) ||
        !('content' in record) ||
        !('created_at' in record) ||
        !('updated_at' in record)
    ) {
        return null
    }

    const id = Number(record.id)
    const reunionId = Number(record.reunion_id)
    const studentId = Number(record.student_id)

    if (
        Number.isNaN(id) ||
        Number.isNaN(reunionId) ||
        Number.isNaN(studentId) ||
        typeof record.content !== 'string' ||
        typeof record.created_at !== 'string' ||
        typeof record.updated_at !== 'string'
    ) {
        return null
    }

    return {
        id,
        reunion_id: reunionId,
        student_id: studentId,
        content: record.content,
        student_name: typeof record.student_name === 'string' ? record.student_name : undefined,
        created_at: record.created_at,
        updated_at: record.updated_at,
    }
}

function normalizeReunionMessages(payload: unknown): ReunionMessage[] {
    if (!Array.isArray(payload)) {
        return []
    }

    return payload
        .map((message) => normalizeReunionMessage(message))
        .filter((message): message is ReunionMessage => message !== null)
}

function normalizeReunion(reunion: unknown): Reunion | null {
    if (typeof reunion !== 'object' || reunion === null) {
        return null
    }

    const reunionRecord = reunion as Record<string, unknown>
    if (
        typeof reunionRecord.id !== 'number' &&
        typeof reunionRecord.id !== 'string'
    ) {
        return null
    }

    if (
        typeof reunionRecord.title !== 'string' ||
        typeof reunionRecord.scheduled_for !== 'string'
    ) {
        return null
    }

    const participantStudents = [
        normalizeParticipants(reunionRecord.participant_students),
        normalizeParticipants(reunionRecord.participants),
        normalizeParticipants(reunionRecord.students),
    ].find((participants) => participants.length > 0) ?? []

    const participantNames = Array.isArray(reunionRecord.participant_student_names)
        ? reunionRecord.participant_student_names.filter(
            (name): name is string => typeof name === 'string',
        )
        : participantStudents.map((participant) => participant.name)

    const subjectName =
        typeof reunionRecord.subject_name === 'string'
            ? reunionRecord.subject_name
            : typeof reunionRecord.subject === 'string'
                ? reunionRecord.subject
                : typeof reunionRecord.subject === 'object' &&
                    reunionRecord.subject !== null &&
                    'name' in reunionRecord.subject &&
                    typeof (reunionRecord.subject as { name?: unknown }).name === 'string'
                    ? (reunionRecord.subject as { name: string }).name
                    : undefined

    return {
        ...(reunionRecord as Reunion),
        id: Number(reunionRecord.id),
        subject_name: subjectName,
        participant_students: participantStudents,
        participant_student_names: participantNames,
    }
}

function extractReunionPayload(payload: unknown): Reunion | null {
    const normalizedFromRoot = normalizeReunion(payload)
    if (normalizedFromRoot) {
        return normalizedFromRoot
    }

    if (typeof payload !== 'object' || payload === null) {
        return null
    }

    if ('reunion' in payload) {
        return normalizeReunion((payload as Record<string, unknown>).reunion)
    }

    return null
}

async function getFromApi(path: string, init?: RequestInit) {
    const response = await fetch(buildApiUrl(path), {
        credentials: 'include',
        ...init,
        headers: { ...authHeader(), ...(init?.headers as Record<string, string> ?? {}) },
    })
    if (!response.ok) {
        throw new Error(`Request failed: ${response.status}`)
    }

    return response.json()
}

async function parseApiError(response: Response, fallback: string) {
    const rawBody = await response.text().catch(() => '')
    let parsedBody: ApiError | null = null

    if (rawBody) {
        try {
            parsedBody = JSON.parse(rawBody) as ApiError
        } catch {
            parsedBody = null
        }
    }

    const errorMessage = parsedBody?.errors?.join(', ') ?? parsedBody?.error ?? rawBody.trim()
    return errorMessage || fallback
}

function normalizeStudentGroups(payload: unknown) {
    return normalizeCollection<StudentGroup>(payload, 'student_groups')
}

function normalizeInvitations(payload: unknown): StudentGroupInvitation[] {
    if (Array.isArray(payload)) {
        return payload.filter((item): item is StudentGroupInvitation => {
            return (
                typeof item === 'object' &&
                item !== null &&
                'id' in item &&
                'student_group_id' in item &&
                'inviter_id' in item &&
                'invitee_id' in item &&
                'status' in item
            )
        })
    }

    if (typeof payload === 'object' && payload !== null && 'student_group_invitations' in payload) {
        return normalizeInvitations((payload as Record<string, unknown>).student_group_invitations)
    }

    return []
}

function normalizeInvitableStudents(payload: unknown): InvitableStudent[] {
    if (!Array.isArray(payload)) {
        return []
    }

    return payload
        .filter((item): item is InvitableStudent => {
            return (
                typeof item === 'object' &&
                item !== null &&
                'id' in item &&
                'full_name' in item &&
                'email' in item
            )
        })
        .map((student) => ({
            ...student,
            id: Number(student.id),
        }))
}

async function getStudentGroups() {
    try {
        return await getFromApi('/api/student_groups')
    } catch {
        return getFromApi('/api/groups')
    }
}

export async function loadDashboardData() {
    const [subjectsPayload, reunionsPayload] = await Promise.all([
        getFromApi('/api/subjects'),
        getFromApi('/api/reunions'),
    ])

    const groupsPayload = await getStudentGroups().catch(() => [])

    return {
        subjects: normalizeCollection<Subject>(subjectsPayload, 'subjects'),
        groups: normalizeStudentGroups(groupsPayload),
        reunions: normalizeReunions(reunionsPayload),
    }
}

export async function refreshStudentGroups() {
    const payload = await getFromApi('/api/student_groups')
    return normalizeStudentGroups(payload)
}

export async function createStudentGroup(payload: StudentGroupPayload) {
    const response = await fetch(buildApiUrl('/api/student_groups'), {
        method: 'POST',
        credentials: 'include',
        headers: {
            ...authHeader(),
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ student_group: payload }),
    })

    if (!response.ok) {
        throw new Error(await parseApiError(response, 'Could not create student group.'))
    }

    return (await response.json()) as StudentGroup
}

export async function updateStudentGroup(studentGroupId: number, payload: StudentGroupPayload) {
    const response = await fetch(buildApiUrl(`/api/student_groups/${studentGroupId}`), {
        method: 'PATCH',
        credentials: 'include',
        headers: {
            ...authHeader(),
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ student_group: payload }),
    })

    if (!response.ok) {
        throw new Error(await parseApiError(response, 'Could not update student group.'))
    }

    return (await response.json()) as StudentGroup
}

export async function deleteStudentGroup(studentGroupId: number) {
    const response = await fetch(buildApiUrl(`/api/student_groups/${studentGroupId}`), {
        method: 'DELETE',
        credentials: 'include',
    })

    if (!response.ok) {
        throw new Error(await parseApiError(response, 'Could not delete student group.'))
    }
}

export async function inviteStudentToGroup(studentGroupId: number, inviteeId: number) {
    const response = await fetch(buildApiUrl(`/api/student_groups/${studentGroupId}/student_group_invitations`), {
        method: 'POST',
        credentials: 'include',
        headers: {
            ...authHeader(),
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            student_group_invitation: {
                invitee_id: inviteeId,
            },
        }),
    })

    if (!response.ok) {
        throw new Error(await parseApiError(response, 'Could not invite this student.'))
    }

    return (await response.json()) as StudentGroupInvitation
}

export async function getInvitableStudents(studentGroupId: number, query: string) {
    const params = new URLSearchParams()
    if (query.trim()) {
        params.set('q', query.trim())
    }

    const qs = params.toString()
    const path = `/api/student_groups/${studentGroupId}/invitable_students${qs ? `?${qs}` : ''}`
    const payload = await getFromApi(path)
    return normalizeInvitableStudents(payload)
}

export async function leaveStudentGroup(studentGroupId: number, newCreatorStudentId?: number) {
    const response = await fetch(buildApiUrl(`/api/student_groups/${studentGroupId}/leave`), {
        method: 'POST',
        credentials: 'include',
        headers: {
            ...authHeader(),
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(
            newCreatorStudentId
                ? { new_creator_student_id: newCreatorStudentId }
                : {},
        ),
    })

    if (!response.ok) {
        throw new Error(await parseApiError(response, 'Could not leave this student group.'))
    }

    return (await response.json()) as StudentGroup
}

export async function getPendingStudentGroupInvitations() {
    const payload = await getFromApi('/api/student_group_invitations')
    return normalizeInvitations(payload)
}

export async function respondToStudentGroupInvitation(
    invitationId: number,
    status: 'accepted' | 'declined',
) {
    const response = await fetch(buildApiUrl(`/api/student_group_invitations/${invitationId}`), {
        method: 'PATCH',
        credentials: 'include',
        headers: {
            ...authHeader(),
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            student_group_invitation: {
                status,
            },
        }),
    })

    if (!response.ok) {
        throw new Error(await parseApiError(response, 'Could not update invitation status.'))
    }

    return (await response.json()) as StudentGroupInvitation
}

function buildReunionsQuery(filters: ReunionFilters) {
    const params = new URLSearchParams()

    if (filters.q?.trim()) {
        params.set('q', filters.q.trim())
    }

    if (typeof filters.subjectId === 'number') {
        params.set('subject_id', String(filters.subjectId))
    }

    if (filters.visibility) {
        params.set('visibility', filters.visibility)
    }

    const query = params.toString()
    return query ? `?${query}` : ''
}

export async function refreshReunions(
    filters: ReunionFilters = {},
    signal?: AbortSignal,
) {
    const payload = await getFromApi(`/api/reunions${buildReunionsQuery(filters)}`, { signal })
    return normalizeReunions(payload)
}

export async function createReunion(payload: ReunionPayload) {
    const response = await fetch(buildApiUrl('/api/reunions'), {
        method: 'POST',
        credentials: 'include',
        headers: {
            ...authHeader(),
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ reunion: payload }),
    })

    if (!response.ok) {
        const errorMessage = await parseApiError(response, 'Could not create reunion.')
        throw new Error(errorMessage ?? 'Could not create reunion.')
    }

    return (await response.json().catch(() => null)) as Reunion | null
}

export async function getReunionDetails(reunionId: number, signal?: AbortSignal) {
    const payload = await getFromApi(`/api/reunions/${reunionId}`, { signal })
    const reunion = extractReunionPayload(payload)

    if (!reunion) {
        throw new Error('Could not load reunion details.')
    }

    return reunion
}

export async function joinReunion(reunionId: number, studentId: number) {
    const response = await fetch(buildApiUrl(`/api/reunions/${reunionId}/join`), {
        method: 'POST',
        credentials: 'include',
        headers: {
            ...authHeader(),
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            student_id: studentId,
        }),
    })

    if (!response.ok) {
        const error = new Error(`Request failed: ${response.status}`)
            ; (error as Error & { status?: number }).status = response.status
        throw error
    }

    const payload = (await response.json().catch(() => null)) as unknown
    const reunion = extractReunionPayload(payload)

    if (!reunion) {
        throw new Error('Could not load reunion details after join.')
    }

    return reunion
}

export async function getReunionMessages(reunionId: number, signal?: AbortSignal) {
    const payload = await getFromApi(`/api/reunions/${reunionId}/reunion_messages`, { signal })
    return normalizeReunionMessages(payload)
}

export async function getPublicStudentProfile(
    studentId: number,
    context: { reunionId?: number; studentGroupId?: number },
) {
    const params = new URLSearchParams()
    if (typeof context.reunionId === 'number') {
        params.set('reunion_id', String(context.reunionId))
    }

    if (typeof context.studentGroupId === 'number') {
        params.set('student_group_id', String(context.studentGroupId))
    }

    const query = params.toString()
    const path = `/api/students/${studentId}/public_profile${query ? `?${query}` : ''}`
    const response = await fetch(buildApiUrl(path), {
        method: 'GET',
        credentials: 'include',
    })

    if (!response.ok) {
        throw new Error(await parseApiError(response, 'Could not load this profile.'))
    }

    return (await response.json()) as PublicStudentProfile
}

export async function createReunionMessage(reunionId: number, studentId: number, content: string) {
    const response = await fetch(buildApiUrl(`/api/reunions/${reunionId}/reunion_messages`), {
        method: 'POST',
        credentials: 'include',
        headers: {
            ...authHeader(),
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            reunion_message: {
                student_id: studentId,
                content,
            },
        }),
    })

    if (!response.ok) {
        throw new Error(await parseApiError(response, 'Could not send message.'))
    }

    const payload = (await response.json().catch(() => null)) as unknown
    const message = normalizeReunionMessage(payload)

    if (!message) {
        throw new Error('Could not parse reunion message response.')
    }

    return message
}

function resolveWebSocketUrl(reunionId: number): string {
    const token = getAccessToken() ?? ''
    const path = `/ws/reunions/${reunionId}/?token=${encodeURIComponent(token)}`
    if (import.meta.env.DEV) {
        return path
    }
    const base = API_BASE_URL || window.location.origin
    const parsed = new URL(base, window.location.origin)
    const protocol = parsed.protocol === 'https:' ? 'wss:' : 'ws:'
    return `${protocol}//${parsed.host}${path}`
}

type SubscriptionHandlers = {
    onMessageCreated: (message: ReunionMessage) => void
}

export function subscribeToReunionMessages(reunionId: number, handlers: SubscriptionHandlers) {
    const ws = new WebSocket(resolveWebSocketUrl(reunionId))

    ws.onmessage = (event) => {
        let data: unknown
        try {
            data = JSON.parse(event.data as string)
        } catch {
            return
        }
        if (typeof data !== 'object' || data === null) return
        const payload = data as Record<string, unknown>
        if (payload.event !== 'message_created') return
        const message = normalizeReunionMessage(payload.message)
        if (message) handlers.onMessageCreated(message)
    }

    return () => {
        ws.close()
    }
}

function resolveLocale(language: string) {
    if (language.toLowerCase().startsWith('es')) {
        return 'es-ES'
    }

    return 'en-US'
}

export function formatDateLabel(value: string, language = 'en') {
    const date = new Date(value)
    if (Number.isNaN(date.getTime())) {
        return value
    }

    return new Intl.DateTimeFormat(resolveLocale(language), {
        dateStyle: 'medium',
        timeStyle: 'short',
    }).format(date)
}

export function toRailsDateTime(dateTimeLocal: string) {
    if (!dateTimeLocal) {
        return ''
    }

    const withSeconds = dateTimeLocal.length === 16 ? `${dateTimeLocal}:00` : dateTimeLocal
    return withSeconds.replace('T', ' ')
}