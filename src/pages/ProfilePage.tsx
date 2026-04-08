import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import InstitutionSelect, { type InstitutionItem } from '../components/InstitutionSelect'
import ProfilePhotoPicker from '../components/ProfilePhotoPicker'
import type { AuthUser, UpdateProfilePayload } from '../types/auth'

type ProfilePageProps = {
    currentUser: AuthUser
    institutions: InstitutionItem[]
    isSubmitting: boolean
    submitError: string
    submitSuccess: string
    onBackToHomepage: () => void
    onSubmit: (payload: UpdateProfilePayload) => Promise<void>
}

function ProfilePage({
    currentUser,
    institutions,
    isSubmitting,
    submitError,
    submitSuccess,
    onBackToHomepage,
    onSubmit,
}: ProfilePageProps) {
    const { t } = useTranslation()
    const [email, setEmail] = useState(currentUser.email)
    const [firstName, setFirstName] = useState(currentUser.firstName ?? '')
    const [lastName, setLastName] = useState(currentUser.lastName ?? '')
    const [description, setDescription] = useState(currentUser.description ?? '')
    const [career, setCareer] = useState(currentUser.career ?? '')
    const [profilePhoto, setProfilePhoto] = useState<File | null>(null)
    const [removeProfilePhoto, setRemoveProfilePhoto] = useState(false)
    const [institutionId, setInstitutionId] = useState(
        currentUser.institutionId ? String(currentUser.institutionId) : '',
    )
    const [localError, setLocalError] = useState('')

    async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault()
        setLocalError('')

        const parsedInstitutionId = Number(institutionId)
        if (!Number.isInteger(parsedInstitutionId) || parsedInstitutionId < 1) {
            setLocalError(t('profile.validationInstitution'))
            return
        }

        if (!firstName.trim() || !lastName.trim()) {
            setLocalError(t('profile.validationName'))
            return
        }

        await onSubmit({
            email: email.trim(),
            firstName: firstName.trim(),
            lastName: lastName.trim(),
            institutionId: parsedInstitutionId,
            description: description.trim(),
            career: career.trim(),
            profilePhoto,
            removeProfilePhoto,
        })
    }

    return (
        <section className="relative mx-auto w-full max-w-4xl">
            <div className="glass-panel animate-enter-up p-7 sm:p-8">
                <header className="mb-6 flex items-center justify-between gap-3">
                    <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.34em] text-amber-200/90">
                            {t('profile.eyebrow')}
                        </p>
                        <h2 className="fantasy-title mt-2 text-2xl font-semibold tracking-tight">
                            {t('profile.title')}
                        </h2>
                        <p className="mt-1 text-sm text-amber-100/75">
                            {t('profile.description')}
                        </p>
                    </div>
                    <button
                        type="button"
                        onClick={onBackToHomepage}
                        className="pixel-button inline-flex items-center justify-center px-4 py-2 text-sm font-semibold"
                    >
                        {t('common.actions.backToHomepage')}
                    </button>
                </header>

                <form className="grid gap-4 sm:grid-cols-[7.5rem,1fr]" onSubmit={handleSubmit}>
                    <ProfilePhotoPicker
                        inputId="profile-photo-input"
                        label={t('profile.photoLabel')}
                        previewAlt={t('profile.photoAlt')}
                        uploadHint={t('profile.photoUploadHint')}
                        initialPreviewUrl={currentUser.profilePhotoUrl ?? null}
                        selectedFile={profilePhoto}
                        removePhoto={removeProfilePhoto}
                        removeLabel={t('profile.removePhotoLabel')}
                        disabled={isSubmitting}
                        onSelectedFileChange={setProfilePhoto}
                        onRemovePhotoChange={setRemoveProfilePhoto}
                        onError={setLocalError}
                    />

                    <div className="grid gap-3 sm:grid-cols-2">
                        <label className="field-label text-xs">
                            {t('profile.firstNameLabel')}
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
                            {t('profile.lastNameLabel')}
                            <input
                                type="text"
                                required
                                value={lastName}
                                onChange={(event) => setLastName(event.target.value)}
                                className="field-input"
                                autoComplete="family-name"
                            />
                        </label>

                        <label className="field-label text-xs">
                            {t('profile.emailLabel')}
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
                            {t('profile.institutionLabel')}
                            <InstitutionSelect
                                institutions={institutions}
                                value={institutionId}
                                onChange={setInstitutionId}
                                placeholder={t('profile.institutionPlaceholder')}
                                noOptionsText={t('profile.institutionNoResults')}
                                isDisabled={isSubmitting}
                            />
                        </label>

                        <label className="field-label text-xs sm:col-span-2">
                            {t('profile.careerLabel')}
                            <input
                                type="text"
                                value={career}
                                onChange={(event) => setCareer(event.target.value)}
                                className="field-input"
                                maxLength={120}
                            />
                        </label>

                        <label className="field-label text-xs sm:col-span-2">
                            {t('profile.descriptionLabel')}
                            <textarea
                                value={description}
                                onChange={(event) => setDescription(event.target.value)}
                                rows={4}
                                className="field-input"
                                maxLength={2000}
                            />
                        </label>
                    </div>

                    <button
                        type="submit"
                        className="pixel-button inline-flex h-11 items-center justify-center px-4 text-sm font-semibold sm:col-span-2"
                        disabled={isSubmitting}
                    >
                        {isSubmitting ? t('profile.saving') : t('profile.saveAction')}
                    </button>
                </form>

                {localError && (
                    <p className="pixel-error mt-3 px-3 py-2 text-sm text-rose-100">
                        {localError}
                    </p>
                )}

                {submitError && (
                    <p className="pixel-error mt-3 px-3 py-2 text-sm text-rose-100">
                        {submitError}
                    </p>
                )}

                {submitSuccess && (
                    <p className="pixel-alert mt-3 px-3 py-2 text-sm text-emerald-100">
                        {submitSuccess}
                    </p>
                )}
            </div>

        </section>
    )
}

export default ProfilePage
