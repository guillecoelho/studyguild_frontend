export type AuthUser = {
    id: number | null
    email: string
    role?: 'admin' | 'student'
    name?: string
    firstName?: string
    lastName?: string
    description?: string | null
    career?: string | null
    profilePhotoUrl?: string | null
    institutionId?: number | null
    institutionName?: string | null
}

export type RegisterPayload = {
    email: string
    password: string
    passwordConfirmation: string
    firstName: string
    lastName: string
    institutionId: number
    profilePhoto?: File | null
}

export type UpdateProfilePayload = {
    email: string
    firstName: string
    lastName: string
    institutionId: number
    description?: string
    career?: string
    profilePhoto?: File | null
    removeProfilePhoto?: boolean
}
