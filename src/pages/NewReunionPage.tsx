import NewReunionForm from '../components/NewReunionForm'
import { useTranslation } from 'react-i18next'
import type { ReunionPayload, StudentGroup, Subject } from '../types/reunions'

type NewReunionPageProps = {
    subjects: Subject[]
    groups: StudentGroup[]
    currentUserId: number | null
    isSubmitting: boolean
    onBackToHomepage: () => void
    onOpenLogin: () => void
    onSubmit: (payload: ReunionPayload) => Promise<void>
}

function NewReunionPage({
    subjects,
    groups,
    currentUserId,
    isSubmitting,
    onBackToHomepage,
    onOpenLogin,
    onSubmit,
}: NewReunionPageProps) {
    const { t } = useTranslation()
    const isAuthenticatedStudent = typeof currentUserId === 'number'

    return (
        <section className="relative mx-auto w-full max-w-4xl">
            <div className="glass-panel animate-enter-up p-7 sm:p-8">
                <header className="mb-6 flex items-center justify-between gap-3">
                    <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.34em] text-amber-200/90">
                            {t('newReunionPage.eyebrow')}
                        </p>
                        <h2 className="fantasy-title mt-2 text-2xl font-semibold tracking-tight">
                            {t('newReunionPage.title')}
                        </h2>
                        <p className="mt-1 text-sm text-amber-100/75">
                            {t('newReunionPage.description')}
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

                {!isAuthenticatedStudent && (
                    <div className="pixel-alert mb-6 flex flex-col gap-3 px-4 py-3 text-sm text-amber-100 sm:flex-row sm:items-center sm:justify-between">
                        <p>{t('newReunionPage.authenticatedStudentsOnlyAlert')}</p>
                        <button
                            type="button"
                            onClick={onOpenLogin}
                            className="pixel-button inline-flex items-center justify-center px-3 py-2 text-xs font-semibold"
                        >
                            {t('auth.loginCta')}
                        </button>
                    </div>
                )}

                <NewReunionForm
                    subjects={subjects}
                    groups={groups}
                    currentUserId={currentUserId}
                    isSubmitting={isSubmitting}
                    onSubmit={onSubmit}
                />
            </div>
        </section>
    )
}

export default NewReunionPage