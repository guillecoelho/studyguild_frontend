export type Subject = {
    id: number
    name: string
    code?: string
}

export type StudentGroup = {
    id: number
    name: string
    institution_id?: number
    creator_student_id?: number
    creator_student_name?: string
    student_ids?: number[]
    students?: Array<{
        id: number
        name: string
        career?: string | null
        profile_photo_url?: string | null
    }>
    can_manage?: boolean
}

export type StudentGroupPayload = {
    name: string
    institution_id?: number
}

export type StudentGroupInvitation = {
    id: number
    student_group_id: number
    student_group_name?: string
    inviter_id: number
    inviter_name?: string
    invitee_id: number
    invitee_name?: string
    status: 'pending' | 'accepted' | 'declined'
}

export type InvitableStudent = {
    id: number
    full_name: string
    email: string
}

export type ReunionParticipant = {
    id: number
    name: string
    career?: string | null
    description?: string | null
    profile_photo_url?: string | null
}

export type PublicStudentProfile = {
    id: number
    first_name?: string
    last_name?: string
    full_name: string
    description?: string | null
    career?: string | null
    institution_name?: string | null
    profile_photo_url?: string | null
}

export type ReunionMessage = {
    id: number
    reunion_id: number
    student_id: number
    content: string
    student_name?: string
    created_at: string
    updated_at: string
}

export type Reunion = {
    id: number
    title: string
    description?: string
    scheduled_for: string
    visibility: 'public' | 'private'
    subject_name?: string
    student_group_name?: string | null
    creator_student_name?: string
    messages_count?: number
    participant_student_ids?: number[]
    participant_student_names?: string[]
    participant_students?: ReunionParticipant[]
}

export type ReunionPayload = {
    title: string
    creator_student_id: number
    subject_id: number
    student_group_id: number | null
    scheduled_for: string
    description: string
    visibility: 'public' | 'private'
}

export type ReunionFilters = {
    q?: string
    subjectId?: number
    visibility?: 'public' | 'private'
}

export type ApiError = {
    error?: string
    errors?: string[]
}

export type NewReunionFormState = {
    title: string
    subjectId: string
    startsAt: string
    description: string
    visibility: 'public' | 'private'
    studentGroupId: string
}

export const defaultNewReunionForm: NewReunionFormState = {
    title: '',
    subjectId: '',
    startsAt: '',
    description: '',
    visibility: 'public',
    studentGroupId: '',
}