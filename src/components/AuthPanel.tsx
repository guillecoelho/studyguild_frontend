import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import InstitutionSelect, { type InstitutionItem } from './InstitutionSelect'
import ProfilePhotoPicker from './ProfilePhotoPicker'
import type { AuthUser, RegisterPayload } from '../types/auth'

type AuthPanelProps = {
    currentUser: AuthUser | null
    institutions: InstitutionItem[]
    isAuthLoading: boolean
    isAuthSubmitting: boolean
    authError: string
    onLogin: (email: string, password: string) => Promise<void>
    onRegister: (payload: RegisterPayload) => Promise<void>
    onLogout: () => Promise<void>
}

function AuthPanel({
    currentUser,
    institutions,
    isAuthLoading,
    isAuthSubmitting,
    authError,
    onLogin,
    onRegister,
    onLogout,
}: AuthPanelProps) {
    const { t } = useTranslation()
    const [mode, setMode] = useState<'login' | 'register'>('login')
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [passwordConfirmation, setPasswordConfirmation] = useState('')
    const [firstName, setFirstName] = useState('')
    const [lastName, setLastName] = useState('')
    const [institutionId, setInstitutionId] = useState('')
    const [profilePhoto, setProfilePhoto] = useState<File | null>(null)
    const [localFormError, setLocalFormError] = useState('')

    async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault()
        setLocalFormError('')

        if (mode === 'login') {
            await onLogin(email.trim(), password)
            setPassword('')
            return
        }

        if (password !== passwordConfirmation) {
            setLocalFormError(t('auth.passwordConfirmationMismatch'))
            return
        }

        const parsedInstitutionId = Number(institutionId)
        if (!Number.isInteger(parsedInstitutionId) || parsedInstitutionId < 1) {
            setLocalFormError(t('auth.institutionIdInvalid'))
            return
        }

        await onRegister({
            email: email.trim(),
            password,
            passwordConfirmation,
            firstName: firstName.trim(),
            lastName: lastName.trim(),
            institutionId: parsedInstitutionId,
            profilePhoto,
        })

        setPassword('')
        setPasswordConfirmation('')
    }

    if (isAuthLoading) {
        return (
            <div className="pixel-card px-4 py-3 text-sm text-amber-100/80">
                {t('auth.checkingSession')}
            </div>
        )
    }

    if (currentUser) {
        return (
            <div className="pixel-card flex flex-col gap-2 px-4 py-3 text-sm sm:flex-row sm:items-center sm:gap-3">
                <span className="text-amber-100/85">
                    {t('auth.signedInAs')}: <strong>{currentUser.email}</strong>
                </span>
                <button
                    type="button"
                    className="pixel-button inline-flex items-center justify-center px-3 py-1.5 text-sm font-semibold"
                    onClick={() => void onLogout()}
                    disabled={isAuthSubmitting}
                >
                    {isAuthSubmitting ? t('auth.logoutLoading') : t('auth.logoutAction')}
                </button>
            </div>
        )
    }

    return (
        <div className="pixel-card w-full px-4 py-4 sm:max-w-xl">
            <div className="mb-3 inline-flex gap-2">
                <button
                    type="button"
                    onClick={() => {
                        setMode('login')
                        setLocalFormError('')
                        setProfilePhoto(null)
                    }}
                    className={`pixel-button px-3 py-1.5 text-xs font-semibold ${mode === 'login' ? '' : 'opacity-70'}`}
                >
                    {t('auth.loginTab')}
                </button>
                <button
                    type="button"
                    onClick={() => {
                        setMode('register')
                        setLocalFormError('')
                    }}
                    className={`pixel-button px-3 py-1.5 text-xs font-semibold ${mode === 'register' ? '' : 'opacity-70'}`}
                >
                    {t('auth.registerTab')}
                </button>
            </div>

            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-amber-200/80">
                {mode === 'login' ? t('auth.title') : t('auth.registerTitle')}
            </p>
            <p className="mt-1 text-sm text-amber-100/75">
                {mode === 'login' ? t('auth.subtitle') : t('auth.registerSubtitle')}
            </p>

            <form className="mt-3 grid gap-3 sm:grid-cols-2" onSubmit={handleSubmit}>
                {mode === 'register' && (
                    <>
                        <label className="field-label text-xs">
                            {t('auth.firstNameLabel')}
                            <input
                                type="text"
                                required
                                value={firstName}
                                onChange={(event) => setFirstName(event.target.value)}
                                className="field-input"
                                autoComplete="given-name"
                            />
                        </label>

                        <label className="field-label text-xs">
                            {t('auth.lastNameLabel')}
                            <input
                                type="text"
                                required
                                value={lastName}
                                onChange={(event) => setLastName(event.target.value)}
                                className="field-input"
                                autoComplete="family-name"
                            />
                        </label>
                    </>
                )}

                <label className="field-label text-xs">
                    {t('auth.emailLabel')}
                    <input
                        type="email"
                        required
                        value={email}
                        onChange={(event) => setEmail(event.target.value)}
                        className="field-input"
                        autoComplete="email"
                    />
                </label>

                <label className="field-label text-xs">
                    {t('auth.passwordLabel')}
                    <input
                        type="password"
                        required
                        value={password}
                        onChange={(event) => setPassword(event.target.value)}
                        className="field-input"
                        autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                    />
                </label>

                {mode === 'register' && (
                    <>
                        <label className="field-label text-xs">
                            {t('auth.passwordConfirmationLabel')}
                            <input
                                type="password"
                                required
                                value={passwordConfirmation}
                                onChange={(event) => setPasswordConfirmation(event.target.value)}
                                className="field-input"
                                autoComplete="new-password"
                            />
                        </label>

                        <label className="field-label text-xs">
                            {t('auth.institutionLabel')}
                            <InstitutionSelect
                                institutions={institutions}
                                value={institutionId}
                                onChange={setInstitutionId}
                                placeholder={t('auth.institutionPlaceholder')}
                                noOptionsText={t('auth.institutionNoResults')}
                                isDisabled={isAuthSubmitting}
                            />
                        </label>

                        <ProfilePhotoPicker
                            inputId="register-profile-photo-input"
                            label={t('auth.profilePhotoLabel')}
                            previewAlt={t('profile.photoAlt')}
                            uploadHint={t('auth.profilePhotoHint')}
                            selectedFile={profilePhoto}
                            disabled={isAuthSubmitting}
                            wrapperClassName="field-label text-xs sm:col-span-2"
                            buttonClassName="mt-2 flex h-24 w-24 items-center justify-center overflow-hidden rounded-sm border border-amber-100/25 bg-black/20"
                            onSelectedFileChange={setProfilePhoto}
                            onError={setLocalFormError}
                        />
                    </>
                )}

                <button
                    type="submit"
                    className="pixel-button inline-flex h-11 items-center justify-center px-4 text-sm font-semibold sm:col-span-2"
                    disabled={isAuthSubmitting}
                >
                    {isAuthSubmitting
                        ? mode === 'login'
                            ? t('auth.loginLoading')
                            : t('auth.registerLoading')
                        : mode === 'login'
                            ? t('auth.loginAction')
                            : t('auth.registerAction')}
                </button>
            </form>

            {localFormError && (
                <p className="pixel-error mt-3 px-3 py-2 text-sm text-rose-100">
                    {localFormError}
                </p>
            )}

            {authError && (
                <p className="pixel-error mt-3 px-3 py-2 text-sm text-rose-100">
                    {authError}
                </p>
            )}
        </div>
    )
}

export default AuthPanel
