import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { createNewsletterEntry } from '../services/newsletterApi'
import type { NewsletterEntryType } from '../types/newsletter'

type NewsletterAdminPageProps = {
    isAuthenticated: boolean
    isAdmin: boolean
    onBackToHomepage: () => void
    onOpenLogin: () => void
}

function NewsletterAdminPage({
    isAuthenticated,
    isAdmin,
    onBackToHomepage,
    onOpenLogin,
}: NewsletterAdminPageProps) {
    const { t } = useTranslation()
    const [title, setTitle] = useState('')
    const [entryType, setEntryType] = useState<NewsletterEntryType>('news')
    const [summary, setSummary] = useState('')
    const [content, setContent] = useState('')
    const [publishedAt, setPublishedAt] = useState('')
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [submitError, setSubmitError] = useState('')
    const [submitSuccess, setSubmitSuccess] = useState('')

    async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault()

        if (!title.trim() || !content.trim()) {
            setSubmitError(t('newsletterAdmin.validationRequired'))
            return
        }

        setIsSubmitting(true)
        setSubmitError('')
        setSubmitSuccess('')

        try {
            await createNewsletterEntry({
                title: title.trim(),
                entry_type: entryType,
                summary: summary.trim(),
                content: content.trim(),
                published_at: publishedAt ? new Date(publishedAt).toISOString() : undefined,
            })

            setTitle('')
            setEntryType('news')
            setSummary('')
            setContent('')
            setPublishedAt('')
            setSubmitSuccess(t('newsletterAdmin.created'))
        } catch (error) {
            setSubmitError(error instanceof Error ? error.message : t('errors.createNewsletterEntry'))
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <section className="relative mx-auto w-full max-w-4xl">
            <div className="glass-panel animate-enter-up p-7 sm:p-8">
                <header className="mb-6 flex items-center justify-between gap-3">
                    <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.34em] text-amber-200/90">
                            {t('newsletterAdmin.eyebrow')}
                        </p>
                        <h2 className="fantasy-title mt-2 text-2xl font-semibold tracking-tight">
                            {t('newsletterAdmin.title')}
                        </h2>
                        <p className="mt-1 text-sm text-amber-100/75">
                            {t('newsletterAdmin.description')}
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

                {!isAuthenticated ? (
                    <div className="pixel-card p-4 text-sm text-amber-100/90">
                        <p>{t('auth.loginRequiredForNewsletterAdmin')}</p>
                        <button
                            type="button"
                            onClick={onOpenLogin}
                            className="pixel-button mt-3 inline-flex items-center justify-center px-4 py-2 text-sm font-semibold"
                        >
                            {t('auth.loginCta')}
                        </button>
                    </div>
                ) : !isAdmin ? (
                    <div className="pixel-error p-4 text-sm text-red-100">
                        {t('newsletterAdmin.adminOnly')}
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className="grid gap-4">
                        <label className="field-label">
                            <span>{t('newsletterAdmin.fields.title')}</span>
                            <input
                                type="text"
                                className="field-input"
                                value={title}
                                onChange={(event) => setTitle(event.target.value)}
                                maxLength={160}
                                placeholder={t('newsletterAdmin.placeholders.title')}
                            />
                        </label>

                        <label className="field-label">
                            <span>{t('newsletterAdmin.fields.type')}</span>
                            <select
                                className="field-input"
                                value={entryType}
                                onChange={(event) => setEntryType(event.target.value as NewsletterEntryType)}
                            >
                                <option value="news">{t('newsletter.types.news')}</option>
                                <option value="article">{t('newsletter.types.article')}</option>
                            </select>
                        </label>

                        <label className="field-label">
                            <span>{t('newsletterAdmin.fields.summary')}</span>
                            <input
                                type="text"
                                className="field-input"
                                value={summary}
                                onChange={(event) => setSummary(event.target.value)}
                                maxLength={280}
                                placeholder={t('newsletterAdmin.placeholders.summary')}
                            />
                        </label>

                        <label className="field-label">
                            <span>{t('newsletterAdmin.fields.content')}</span>
                            <textarea
                                className="field-input min-h-40"
                                value={content}
                                onChange={(event) => setContent(event.target.value)}
                                placeholder={t('newsletterAdmin.placeholders.content')}
                            />
                        </label>

                        <label className="field-label">
                            <span>{t('newsletterAdmin.fields.publishedAt')}</span>
                            <input
                                type="datetime-local"
                                className="field-input"
                                value={publishedAt}
                                onChange={(event) => setPublishedAt(event.target.value)}
                            />
                        </label>

                        {submitError && (
                            <div className="pixel-error px-3 py-2 text-sm text-red-100">{submitError}</div>
                        )}
                        {submitSuccess && (
                            <div className="pixel-alert px-3 py-2 text-sm text-emerald-100">{submitSuccess}</div>
                        )}

                        <div>
                            <button
                                type="submit"
                                className="pixel-button inline-flex items-center justify-center px-5 py-2 text-sm font-semibold"
                                disabled={isSubmitting}
                            >
                                {isSubmitting ? t('newsletterAdmin.submitting') : t('newsletterAdmin.submitAction')}
                            </button>
                        </div>
                    </form>
                )}
            </div>
        </section>
    )
}

export default NewsletterAdminPage
