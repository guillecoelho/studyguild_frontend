import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { createIssueReport } from '../services/issueReportsApi'

type IssuesPageProps = {
    isAuthenticated: boolean
    onBackToHomepage: () => void
    onOpenLogin: () => void
}

const MAX_IMAGE_COUNT = 5

function IssuesPage({ isAuthenticated, onBackToHomepage, onOpenLogin }: IssuesPageProps) {
    const { t } = useTranslation()
    const [title, setTitle] = useState('')
    const [description, setDescription] = useState('')
    const [images, setImages] = useState<File[]>([])
    const [localError, setLocalError] = useState('')
    const [submitError, setSubmitError] = useState('')
    const [submitSuccess, setSubmitSuccess] = useState('')
    const [isSubmitting, setIsSubmitting] = useState(false)

    async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault()
        setLocalError('')
        setSubmitError('')
        setSubmitSuccess('')

        if (!title.trim() || !description.trim()) {
            setLocalError(t('issuesPage.validationRequired'))
            return
        }

        if (images.length > MAX_IMAGE_COUNT) {
            setLocalError(t('issuesPage.validationMaxImages', { max: MAX_IMAGE_COUNT }))
            return
        }

        setIsSubmitting(true)

        try {
            await createIssueReport({
                title,
                description,
                images,
            })

            setTitle('')
            setDescription('')
            setImages([])
            setSubmitSuccess(t('issuesPage.submitted'))
        } catch (error) {
            setSubmitError(error instanceof Error ? error.message : t('errors.createIssueReport'))
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <section className="relative mx-auto w-full max-w-4xl">
            <div className="glass-panel animate-enter-up p-7 sm:p-8">
                <header className="mb-6 flex items-start justify-between gap-3">
                    <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.34em] text-amber-200/90">
                            {t('issuesPage.eyebrow')}
                        </p>
                        <h2 className="fantasy-title mt-2 text-2xl font-semibold tracking-tight sm:text-3xl">
                            {t('issuesPage.title')}
                        </h2>
                        <p className="mt-2 max-w-2xl text-sm text-amber-100/80 sm:text-base">
                            {t('issuesPage.description')}
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

                {!isAuthenticated && (
                    <div className="pixel-error mb-4 px-3 py-2 text-sm text-red-100">
                        <p>{t('issuesPage.loginRequired')}</p>
                        <button
                            type="button"
                            className="pixel-button mt-3 inline-flex items-center justify-center px-3 py-1.5 text-sm font-semibold"
                            onClick={onOpenLogin}
                        >
                            {t('auth.loginCta')}
                        </button>
                    </div>
                )}

                <form className="grid gap-4" onSubmit={handleSubmit}>
                    <label className="field-label text-xs">
                        {t('issuesPage.fields.title')}
                        <input
                            type="text"
                            required
                            maxLength={160}
                            value={title}
                            onChange={(event) => setTitle(event.target.value)}
                            className="field-input"
                            placeholder={t('issuesPage.placeholders.title')}
                            disabled={isSubmitting || !isAuthenticated}
                        />
                    </label>

                    <label className="field-label text-xs">
                        {t('issuesPage.fields.description')}
                        <textarea
                            required
                            rows={6}
                            maxLength={5000}
                            value={description}
                            onChange={(event) => setDescription(event.target.value)}
                            className="field-input"
                            placeholder={t('issuesPage.placeholders.description')}
                            disabled={isSubmitting || !isAuthenticated}
                        />
                    </label>

                    <label className="field-label text-xs">
                        {t('issuesPage.fields.images')}
                        <input
                            type="file"
                            accept="image/*"
                            multiple
                            onChange={(event) => {
                                const selectedFiles = Array.from(event.target.files ?? [])
                                setImages(selectedFiles)
                            }}
                            className="field-input"
                            disabled={isSubmitting || !isAuthenticated}
                        />
                        <span className="text-xs normal-case tracking-normal text-amber-100/70">
                            {t('issuesPage.imagesHint', { max: MAX_IMAGE_COUNT })}
                        </span>
                    </label>

                    {images.length > 0 && (
                        <div className="pixel-card p-3">
                            <p className="text-xs uppercase tracking-[0.12em] text-amber-200/80">
                                {t('issuesPage.selectedFiles', { count: images.length })}
                            </p>
                            <ul className="mt-2 grid gap-1 text-sm text-amber-100/85">
                                {images.map((file) => (
                                    <li key={`${file.name}-${file.size}`}>{file.name}</li>
                                ))}
                            </ul>
                        </div>
                    )}

                    <button
                        type="submit"
                        className="pixel-button inline-flex h-11 items-center justify-center px-4 text-sm font-semibold"
                        disabled={isSubmitting || !isAuthenticated}
                    >
                        {isSubmitting ? t('issuesPage.submitting') : t('issuesPage.submitAction')}
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

export default IssuesPage
