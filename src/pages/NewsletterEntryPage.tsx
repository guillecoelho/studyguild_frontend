import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useParams } from 'react-router-dom'
import {
    deleteNewsletterEntry,
    getNewsletterEntry,
    updateNewsletterEntry,
} from '../services/newsletterApi'
import type { NewsletterEntry, NewsletterEntryType } from '../types/newsletter'

type NewsletterEntryPageProps = {
    isAuthenticated: boolean
    currentUserId: number | null
    onBackToNewsletter: () => void
}

function NewsletterEntryPage({
    isAuthenticated,
    currentUserId,
    onBackToNewsletter,
}: NewsletterEntryPageProps) {
    const { t, i18n } = useTranslation()
    const { id } = useParams()
    const [entry, setEntry] = useState<NewsletterEntry | null>(null)
    const [isLoading, setIsLoading] = useState(false)
    const [pageError, setPageError] = useState('')
    const [isEditing, setIsEditing] = useState(false)
    const [title, setTitle] = useState('')
    const [entryType, setEntryType] = useState<NewsletterEntryType>('news')
    const [summary, setSummary] = useState('')
    const [content, setContent] = useState('')
    const [publishedAt, setPublishedAt] = useState('')
    const [actionError, setActionError] = useState('')
    const [actionSuccess, setActionSuccess] = useState('')
    const [isSaving, setIsSaving] = useState(false)
    const [isDeleting, setIsDeleting] = useState(false)

    useEffect(() => {
        const parsedId = Number(id)

        if (!Number.isInteger(parsedId) || parsedId <= 0) {
            setPageError(t('errors.loadNewsletterEntry'))
            setEntry(null)
            setIsEditing(false)
            return
        }

        async function loadEntry() {
            setIsLoading(true)
            setPageError('')

            try {
                setEntry(await getNewsletterEntry(parsedId))
            } catch (error) {
                setPageError(error instanceof Error ? error.message : t('errors.loadNewsletterEntry'))
                setEntry(null)
                setIsEditing(false)
            } finally {
                setIsLoading(false)
            }
        }

        void loadEntry()
    }, [id, t])

    useEffect(() => {
        if (!entry) {
            return
        }

        const parsedDate = new Date(entry.published_at)
        const hasValidDate = !Number.isNaN(parsedDate.getTime())
        const localDateTime = hasValidDate
            ? `${parsedDate.getFullYear()}-${String(parsedDate.getMonth() + 1).padStart(2, '0')}-${String(parsedDate.getDate()).padStart(2, '0')}T${String(parsedDate.getHours()).padStart(2, '0')}:${String(parsedDate.getMinutes()).padStart(2, '0')}`
            : ''

        setTitle(entry.title)
        setEntryType(entry.entry_type)
        setSummary(entry.summary ?? '')
        setContent(entry.content)
        setPublishedAt(localDateTime)
    }, [entry])

    const canManageEntry =
        isAuthenticated &&
        typeof currentUserId === 'number' &&
        entry?.author_id === currentUserId

    async function handleSaveChanges(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault()

        if (!entry) {
            return
        }

        if (!title.trim() || !content.trim()) {
            setActionError(t('newsletterAdmin.validationRequired'))
            return
        }

        setIsSaving(true)
        setActionError('')
        setActionSuccess('')

        try {
            const updatedEntry = await updateNewsletterEntry(entry.id, {
                title: title.trim(),
                entry_type: entryType,
                summary: summary.trim(),
                content: content.trim(),
                published_at: publishedAt ? new Date(publishedAt).toISOString() : undefined,
            })

            setEntry(updatedEntry)
            setIsEditing(false)
            setActionSuccess(t('newsletter.updated'))
        } catch (error) {
            setActionError(error instanceof Error ? error.message : t('errors.updateNewsletterEntry'))
        } finally {
            setIsSaving(false)
        }
    }

    async function handleDeleteEntry() {
        if (!entry || !window.confirm(t('newsletter.confirmDelete'))) {
            return
        }

        setIsDeleting(true)
        setActionError('')
        setActionSuccess('')

        try {
            await deleteNewsletterEntry(entry.id)
            onBackToNewsletter()
        } catch (error) {
            setActionError(error instanceof Error ? error.message : t('errors.deleteNewsletterEntry'))
        } finally {
            setIsDeleting(false)
        }
    }

    const dateFormatter = new Intl.DateTimeFormat(i18n.resolvedLanguage?.startsWith('es') ? 'es-ES' : 'en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
    })

    return (
        <section className="relative mx-auto w-full max-w-5xl">
            <div className="glass-panel animate-enter-up p-7 sm:p-8">
                <header className="mb-6 flex items-center justify-between gap-3">
                    <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.34em] text-amber-200/90">
                            {t('newsletter.detailEyebrow')}
                        </p>
                        <h2 className="fantasy-title mt-2 text-2xl font-semibold tracking-tight">
                            {t('newsletter.title')}
                        </h2>
                    </div>
                    <button
                        type="button"
                        onClick={onBackToNewsletter}
                        className="pixel-button inline-flex items-center justify-center px-4 py-2 text-sm font-semibold"
                    >
                        {t('newsletter.backToList')}
                    </button>
                </header>

                {pageError && (
                    <div className="pixel-error mb-4 px-3 py-2 text-sm text-red-100">{pageError}</div>
                )}
                {actionError && (
                    <div className="pixel-error mb-4 px-3 py-2 text-sm text-red-100">{actionError}</div>
                )}
                {actionSuccess && (
                    <div className="pixel-alert mb-4 px-3 py-2 text-sm text-emerald-100">{actionSuccess}</div>
                )}

                {isLoading ? (
                    <div className="grid gap-4">
                        <div className="skeleton-line h-8" />
                        <div className="skeleton-line h-40" />
                    </div>
                ) : entry ? (
                    <article className="newsletter-card p-4 sm:p-5">
                        <header className="mb-3 flex flex-wrap items-center justify-between gap-2">
                            <h3 className="fantasy-title text-2xl leading-tight text-amber-100">{entry.title}</h3>
                            <span className={`pixel-tag px-2 py-1 text-xs uppercase ${entry.entry_type === 'article' ? 'is-public' : 'is-private'}`}>
                                {entry.entry_type === 'article' ? t('newsletter.types.article') : t('newsletter.types.news')}
                            </span>
                        </header>

                        {canManageEntry && (
                            <div className="mb-4 flex flex-wrap gap-2">
                                {!isEditing && (
                                    <button
                                        type="button"
                                        className="pixel-button inline-flex items-center justify-center px-3 py-1.5 text-sm font-semibold"
                                        onClick={() => {
                                            setIsEditing(true)
                                            setActionError('')
                                            setActionSuccess('')
                                        }}
                                    >
                                        {t('newsletter.editAction')}
                                    </button>
                                )}
                                <button
                                    type="button"
                                    className="pixel-button inline-flex items-center justify-center px-3 py-1.5 text-sm font-semibold"
                                    onClick={() => {
                                        void handleDeleteEntry()
                                    }}
                                    disabled={isDeleting}
                                >
                                    {isDeleting ? t('newsletter.deleting') : t('newsletter.deleteAction')}
                                </button>
                            </div>
                        )}

                        {isEditing && canManageEntry ? (
                            <form onSubmit={handleSaveChanges} className="grid gap-4">
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

                                <div className="flex flex-wrap gap-2">
                                    <button
                                        type="submit"
                                        className="pixel-button inline-flex items-center justify-center px-4 py-2 text-sm font-semibold"
                                        disabled={isSaving}
                                    >
                                        {isSaving ? t('newsletter.saving') : t('newsletter.saveAction')}
                                    </button>
                                    <button
                                        type="button"
                                        className="pixel-button inline-flex items-center justify-center px-4 py-2 text-sm font-semibold"
                                        onClick={() => {
                                            setIsEditing(false)
                                            setActionError('')
                                        }}
                                    >
                                        {t('common.actions.dismiss')}
                                    </button>
                                </div>
                            </form>
                        ) : (
                            <>
                                {entry.summary && (
                                    <p className="text-[0.95rem] text-amber-100/80">{entry.summary}</p>
                                )}

                                <p className="mt-3 whitespace-pre-wrap text-[1.04rem] leading-relaxed text-amber-50/88">
                                    {entry.content}
                                </p>
                            </>
                        )}

                        <footer className="mt-4 text-xs uppercase tracking-[0.16em] text-amber-200/65">
                            {t('newsletter.byline', {
                                author: entry.author_name,
                                date: dateFormatter.format(new Date(entry.published_at)),
                            })}
                        </footer>
                    </article>
                ) : null}
            </div>
        </section>
    )
}

export default NewsletterEntryPage
