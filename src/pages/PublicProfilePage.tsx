import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useParams, useSearchParams } from 'react-router-dom'
import { getPublicStudentProfile } from '../services/reunionsApi'
import type { PublicStudentProfile } from '../types/reunions'

type PublicProfilePageProps = {
    isAuthenticated: boolean
    onBackToHomepage: () => void
    onOpenLogin: () => void
}

function PublicProfilePage({
    isAuthenticated,
    onBackToHomepage,
    onOpenLogin,
}: PublicProfilePageProps) {
    const { t } = useTranslation()
    const params = useParams<{ id: string }>()
    const [searchParams] = useSearchParams()
    const [profile, setProfile] = useState<PublicStudentProfile | null>(null)
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState('')

    const studentId = Number(params.id)
    const reunionId = Number(searchParams.get('reunionId'))
    const studentGroupId = Number(searchParams.get('studentGroupId'))

    useEffect(() => {
        if (!isAuthenticated || !Number.isInteger(studentId) || studentId <= 0) {
            return
        }

        let isCurrent = true

        async function loadProfile() {
            setIsLoading(true)
            setError('')

            try {
                const payload = await getPublicStudentProfile(studentId, {
                    reunionId: Number.isInteger(reunionId) && reunionId > 0 ? reunionId : undefined,
                    studentGroupId:
                        Number.isInteger(studentGroupId) && studentGroupId > 0 ? studentGroupId : undefined,
                })

                if (isCurrent) {
                    setProfile(payload)
                }
            } catch (fetchError) {
                if (isCurrent) {
                    setError(
                        fetchError instanceof Error
                            ? fetchError.message
                            : t('errors.loadPublicProfile'),
                    )
                }
            } finally {
                if (isCurrent) {
                    setIsLoading(false)
                }
            }
        }

        void loadProfile()

        return () => {
            isCurrent = false
        }
    }, [isAuthenticated, reunionId, studentGroupId, studentId, t])

    if (!isAuthenticated) {
        return (
            <section className="relative mx-auto w-full max-w-3xl">
                <div className="glass-panel animate-enter-up p-7 sm:p-8">
                    <p className="text-sm text-amber-100/90">{t('auth.loginRequiredForJoin')}</p>
                    <button
                        type="button"
                        onClick={onOpenLogin}
                        className="pixel-button mt-3 inline-flex items-center justify-center px-4 py-2 text-sm font-semibold"
                    >
                        {t('auth.loginCta')}
                    </button>
                </div>
            </section>
        )
    }

    return (
        <section className="relative mx-auto w-full max-w-3xl">
            <div className="glass-panel animate-enter-up p-7 sm:p-8">
                <header className="mb-6 flex items-center justify-between gap-3">
                    <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.34em] text-amber-200/90">
                            {t('publicProfile.eyebrow')}
                        </p>
                        <h2 className="fantasy-title mt-2 text-2xl font-semibold tracking-tight">
                            {profile?.full_name ?? t('publicProfile.title')}
                        </h2>
                    </div>
                    <button
                        type="button"
                        onClick={onBackToHomepage}
                        className="pixel-button inline-flex items-center justify-center px-4 py-2 text-sm font-semibold"
                    >
                        {t('common.actions.backToHomepage')}
                    </button>
                </header>

                {isLoading && <p className="text-sm text-amber-100/80">{t('publicProfile.loading')}</p>}

                {!isLoading && error && (
                    <p className="pixel-error px-3 py-2 text-sm text-rose-100">{error}</p>
                )}

                {!isLoading && !error && profile && (
                    <article className="pixel-card p-4">
                        {profile.profile_photo_url && (
                            <img
                                src={profile.profile_photo_url}
                                alt={t('publicProfile.photoAlt')}
                                className="h-28 w-28 rounded-full border border-amber-100/25 object-cover"
                            />
                        )}

                        <p className="mt-3 text-sm text-amber-100/85">
                            {t('publicProfile.careerLabel')}: {profile.career || t('publicProfile.notProvided')}
                        </p>
                        <p className="mt-2 text-sm text-amber-100/85">
                            {t('publicProfile.institutionLabel')}:{' '}
                            {profile.institution_name || t('publicProfile.notProvided')}
                        </p>
                        <p className="mt-3 whitespace-pre-wrap text-sm text-amber-100/90">
                            {profile.description || t('publicProfile.noDescription')}
                        </p>
                    </article>
                )}
            </div>
        </section>
    )
}

export default PublicProfilePage
